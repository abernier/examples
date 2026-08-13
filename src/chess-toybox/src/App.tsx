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
import type { Square } from "chess.js";

import {
  applyMove,
  history,
  newGame,
  replay,
  reply,
  seats,
  verdict,
  type Ply,
  type Toy,
} from "./game";
import { embedded, useTable } from "./net";
import { Board } from "./three/Board";
import { Piece } from "./three/Piece";
import { Room } from "./three/Room";

const OVER = ["won", "lost", "stalemate", "draw"];

// Everything the board says by itself — whose turn it is, who has fallen, what a
// piece can reach — it says better than a panel would, so the only words left
// are the ones a board can't say out loud.
const SAYS: Record<string, string> = {
  check: "Échec !",
  joining: "On vous installe à la table…",
  mateYou: "Échec et mat — vous gagnez",
  mateFriend: "Échec et mat — votre ami gagne",
  mateKitchen: "Échec et mat — la cuisine a gagné",
  stalemate: "Pat",
  draw: "Partie nulle",
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
function Framing({
  controls,
  side,
}: {
  controls: CameraControls | null;
  side: number;
}) {
  const size = useThree((state) => state.size);
  const pull = Math.max(1, 1.6 / (size.width / size.height));
  const framed = useRef(false);
  useEffect(() => {
    if (!controls) return;
    // Instant the first time, eased after: a reframe on a real resize is worth
    // seeing happen.
    controls.setLookAt(0, 0.6 + 7 * pull, side * 12.5 * pull, 0, 0.6, 0, framed.current);
    framed.current = true;
  }, [controls, pull, side]);
  return null;
}

export default function App() {
  const [game, setGame] = useState(newGame);
  const [toys, setToys] = useState(game.toys);
  const [selected, setSelected] = useState<Square | null>(null);
  const [status, setStatus] = useState("playing");
  const [controls, setControls] = useState<CameraControls | null>(null);

  const play = useCallback(
    (from: Square, to: Square) => {
      const move = game.chess.move({ from, to, promotion: "q" });
      setToys((current) => applyMove(current, move, seats(current, move.color)));
      setSelected(null);
      setStatus(verdict(game.chess));
    },
    [game],
  );

  // A game handed over whole: someone joining mid-way, or a restart, which is
  // the same message with nothing in it.
  const set = useCallback((plies: Ply[]) => {
    const next = replay(plies);
    setGame(next);
    setToys(next.toys);
    setSelected(null);
    setStatus(verdict(next.chess));
  }, []);

  const table = useTable({
    // A move that doesn't fit the board we're on means the two games have come
    // apart — better a move that does nothing than a page that goes white.
    move: ({ from, to }) => {
      try {
        play(from, to);
      } catch {
        /* out of step; the next sync will sort it out */
      }
    },
    board: ({ plies, reset }) => {
      if (reset || plies.length > game.chess.history().length) set(plies);
    },
    history: () => history(game.chess),
  });

  // The kitchen keeps black warm. A friend who opens the link takes that chair,
  // whenever they get here — mid-game is fine, they inherit whatever the rats
  // have been up to.
  const mine = table.color;
  const over = OVER.includes(status);
  // Nothing to do but wait: you came by someone's link and they aren't there.
  const waiting = mine === "b" && !table.friend;
  const yours = game.chess.turn() === mine && !over && !waiting;

  const move = (from: Square, to: Square) => {
    play(from, to);
    table.move({ from, to });
  };

  // The answer comes after a beat — instantly is unreadable, and something
  // taking its time is half of what makes it feel like someone is sitting there.
  // It stops the moment a friend arrives, and picks black back up if they go —
  // but only at the white chair. Black is the guest's own side, and a side that
  // starts playing itself the moment the other page closes is a poltergeist.
  useEffect(() => {
    if (mine !== "w" || table.friend) return;
    if (game.chess.turn() !== "b" || OVER.includes(status)) return;
    const timer = setTimeout(() => {
      const answer = reply(game.chess);
      if (answer) play(answer.from, answer.to);
    }, 750);
    return () => clearTimeout(timer);
  }, [game, status, toys, play, mine, table.friend]);

  const targets = useMemo(() => {
    const map = new Map<Square, boolean>();
    if (!selected) return map;
    for (const move of game.chess.moves({ square: selected, verbose: true }))
      map.set(move.to, Boolean(move.captured));
    return map;
  }, [game, selected, toys]);

  // What the cursor should say about a square, which is all the board needs
  // from the game: would clicking here do anything at all?
  const actionable = useCallback(
    (square: Square) =>
      targets.has(square) ||
      (yours && toys.some((t) => t.square === square && t.color === mine && t.takenAt === null)),
    [targets, yours, toys, mine],
  );

  const pick = (square: Square) => {
    if (targets.has(square)) return move(selected!, square);
    const toy = toys.find((t) => t.square === square && t.takenAt === null);
    setSelected(yours && toy?.color === mine ? square : null);
  };

  const restart = () => {
    set([]);
    table.board({ plies: [], reset: true });
  };

  // Checkmate is read out of the position, so it's always white's news; whose
  // news it is depends on which chair you're in.
  const mated = status === "won" || status === "lost";
  const line = waiting
    ? "joining"
    : mated
      ? (status === "won") === (mine === "w")
        ? "mateYou"
        : table.friend
          ? "mateFriend"
          : "mateKitchen"
      : over || status === "check"
        ? status
        : null;

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
        <Framing controls={controls} side={mine === "w" ? 1 : -1} />
        <Room />
        <Board targets={targets} selected={selected} actionable={actionable} onPick={pick} />
        {/* The toys arrive from five files; the board is playable before they
            land, which is the point of keeping the boundary this tight. */}
        <Suspense fallback={null}>
          {toys.map((toy: Toy) => (
            <Piece
              key={toy.id}
              toy={toy}
              selected={toy.square === selected && toy.takenAt === null}
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

      {line && (
        <p className="says">
          {SAYS[line]}
          {over && (
            <button type="button" onClick={restart}>
              Tout ranger et recommencer
            </button>
          )}
        </p>
      )}
      {/* How to play, and the only place the two-player part is mentioned at
          all — there's nothing to set up, so there's nothing to put a panel
          around. It goes once the first toy has moved: by then you know. */}
      <p className={`hint${game.chess.history().length ? " done" : ""}`}>
        Cliquez une pièce, puis une case · glissez pour tourner autour ·{" "}
        {embedded
          ? "ouvrez la page pour jouer à deux"
          : "envoyez l’adresse de la page à un ami pour qu’il prenne la cuisine"}
      </p>
    </>
  );
}
