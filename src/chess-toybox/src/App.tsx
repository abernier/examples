import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import type { Color, PieceSymbol, Square } from "chess.js";

import { applyMove, newGame, reply, verdict, type Toy } from "./game";
import { Board } from "./three/Board";
import { Piece } from "./three/Piece";
import { Room } from "./three/Room";

const OVER = ["won", "lost", "stalemate", "draw"];

const SAYS: Record<string, string> = {
  playing: "À vous de jouer",
  check: "Échec !",
  thinking: "En face, on réfléchit…",
  won: "Échec et mat — vous gagnez",
  lost: "Échec et mat — la cuisine a gagné",
  stalemate: "Pat",
  draw: "Partie nulle",
};

// Who each piece is, for the tally beside the board — two casts, so two lists.
const NAMES: Record<Color, Record<PieceSymbol, string>> = {
  w: {
    p: "un petit soldat",
    n: "Buttercup",
    b: "Buzz",
    r: "Trixie",
    q: "Bo Peep",
    k: "Woody",
  },
  b: {
    p: "Rémy",
    n: "Émile",
    b: "Anton Ego",
    r: "Mabel",
    q: "Colette",
    k: "Linguini",
  },
};

// A perspective camera's fov is vertical, so a portrait window crops the board
// sideways instead of shrinking it. Back the camera off along the same line by
// whatever the aspect is short of the shape this was framed for.
//
// It goes through the controls rather than at `camera.position`: CameraControls
// owns the camera, and a position written behind its back is undone on the next
// frame it damps.
//
// The dependency is that one number and not `size`, which is the whole point.
// R3F hands out a fresh `size` object whenever the canvas's bounding rect moves
// at all — including by a pixel, mid-drag, while nothing about its width or
// height has changed — and every one of those re-ran this effect and put the
// camera back where it started. From the chair that reads as the view resetting
// under your hand, twice a drag.
function Framing({ controls }: { controls: CameraControls | null }) {
  const size = useThree((state) => state.size);
  const pull = Math.max(1, 1.6 / (size.width / size.height));
  const framed = useRef(false);
  useEffect(() => {
    if (!controls) return;
    // Instant the first time, eased after: a reframe on a real resize is worth
    // seeing happen.
    controls.setLookAt(0, 0.6 + 7 * pull, 12.5 * pull, 0, 0.6, 0, framed.current);
    framed.current = true;
  }, [controls, pull]);
  return null;
}

export default function App() {
  const [game, setGame] = useState(newGame);
  const [toys, setToys] = useState(game.toys);
  const [selected, setSelected] = useState<Square | null>(null);
  const [status, setStatus] = useState("playing");
  const [controls, setControls] = useState<CameraControls | null>(null);

  const over = OVER.includes(status);
  const yours = game.chess.turn() === "w" && !over;

  const play = useCallback(
    (from: Square, to: Square) => {
      const move = game.chess.move({ from, to, promotion: "q" });
      setToys((current) =>
        applyMove(
          current,
          move,
          // Its place on the carpet: how many of its own side are already there.
          current.filter(
            (toy) => toy.takenAt !== null && toy.color !== move.color,
          ).length,
        ),
      );
      setSelected(null);
      setStatus(verdict(game.chess));
    },
    [game],
  );

  // The answer comes after a beat — instantly is unreadable, and something
  // taking its time is half of what makes it feel like someone is sitting there.
  useEffect(() => {
    if (game.chess.turn() !== "b" || OVER.includes(status)) return;
    const timer = setTimeout(() => {
      const move = reply(game.chess);
      if (move) play(move.from, move.to);
    }, 750);
    return () => clearTimeout(timer);
  }, [game, status, toys, play]);

  const targets = useMemo(() => {
    const map = new Map<Square, boolean>();
    if (!selected) return map;
    for (const move of game.chess.moves({ square: selected, verbose: true }))
      map.set(move.to, Boolean(move.captured));
    return map;
  }, [game, selected, toys]);

  const pick = (square: Square) => {
    if (targets.has(square)) return play(selected!, square);
    const toy = toys.find((t) => t.square === square && t.takenAt === null);
    setSelected(yours && toy?.color === "w" ? square : null);
  };

  const restart = () => {
    const next = newGame();
    setGame(next);
    setToys(next.toys);
    setSelected(null);
    setStatus("playing");
  };

  const taken = toys.filter((toy) => toy.takenAt !== null);

  return (
    <>
      {/* Low and close, the way you look at a board you're kneeling in front of
          — high enough to read the ranks, low enough to keep the wallpaper
          behind them in frame. */}
      <Canvas
        shadows="soft"
        dpr={[1, 2]}
        camera={{ position: [0, 7.6, 12.5], fov: 34 }}
      >
        <Framing controls={controls} />
        <Room />
        <Board targets={targets} selected={selected} onPick={pick} />
        {/* The toys arrive from five files; the board is playable before they
            land, which is the point of keeping the boundary this tight. */}
        <Suspense fallback={null}>
          {toys.map((toy: Toy) => (
            <Piece
              key={toy.id}
              toy={toy}
              selected={toy.square === selected && toy.takenAt === null}
              // With a toy in hand, everything that isn't the toy or somewhere
              // it can go stops answering the pointer. A toy stands a square
              // tall, so from this camera the ones in front of a target sit
              // between it and the ray, and the click meant for the square
              // lands on a bystander instead. There is nothing else worth
              // clicking at that moment anyway.
              pickable={
                !selected || toy.square === selected || targets.has(toy.square)
              }
              onSelect={() => pick(toy.square)}
            />
          ))}
        </Suspense>
        {/* camera-controls rather than OrbitControls: the same drag, but it
            damps every move instead of stepping to it, which is what the orbit
            was catching on. */}
        <CameraControls
          ref={setControls}
          makeDefault
          smoothTime={0.25}
          minDistance={9}
          maxDistance={34}
          minPolarAngle={0.25}
          maxPolarAngle={1.42}
        />
        {/* Postprocessing is off for now — the N8AO + Vignette pass is one
            import away when the staging is settled. */}
      </Canvas>

      <div className="hud">
        <h1>Toybox</h1>
        <p className="cast">le coffre à jouets contre la cuisine</p>
        <p className={status === "check" || over ? "loud" : ""}>
          {SAYS[yours ? status : over ? status : "thinking"]}
        </p>
        <p className="tally">
          {taken.length
            ? taken.map((toy) => (
                <span
                  key={toy.id}
                  className={toy.color === "w" ? "tan" : "green"}
                >
                  {NAMES[toy.color][toy.type]}
                </span>
              ))
            : "Personne n’est encore tombé"}
        </p>
        <button type="button" onClick={restart}>
          Tout ranger et recommencer
        </button>
      </div>
      <p className="hint">
        Cliquez une pièce, puis une case · glissez pour tourner autour
      </p>
    </>
  );
}
