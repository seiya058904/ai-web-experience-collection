"""Independent SENTE verification, deliberately separate from the TypeScript engine.

Uses coordinate-pair dictionaries and flood-filled sets; no engine imports.
Run: python3 tests/reference-enumeration.py
"""
import json
from pathlib import Path

POINTS = [(x, y) for y in range(1, 8) for x in range(1, 8)]


def coord(p):
    return chr(64 + p[0]) + str(p[1])


def point(c):
    return ord(c[0]) - 64, int(c[1])


def board(black, white=""):
    return {**{point(c): "B" for c in black.split()},
            **{point(c): "W" for c in white.split()}}


def neighbours(p):
    x, y = p
    return {(a, b) for a, b in [(x-1, y), (x+1, y), (x, y-1), (x, y+1)]
            if 1 <= a <= 7 and 1 <= b <= 7}


def group(b, p):
    colour = b.get(p)
    if colour is None:
        return set(), set()
    seen, pending, liberties = set(), {p}, set()
    while pending:
        q = pending.pop()
        if q in seen:
            continue
        seen.add(q)
        for n in neighbours(q):
            if n not in b:
                liberties.add(n)
            elif b[n] == colour and n not in seen:
                pending.add(n)
    return seen, liberties


def play(b, c, colour, forbidden=None):
    p = point(c)
    if p not in POINTS:
        return None, [], "outside"
    if p in b:
        return None, [], "occupied"
    next_board = {**b, p: colour}
    captured = set()
    opponent = "W" if colour == "B" else "B"
    for n in neighbours(p):
        if next_board.get(n) == opponent:
            stones, liberties = group(next_board, n)
            if not liberties:
                captured |= stones
    for dead in captured:
        del next_board[dead]
    if not group(next_board, p)[1]:
        return None, [], "suicide"
    if forbidden is not None and next_board == forbidden:
        return None, [], "repetition"
    return next_board, sorted(map(coord, captured)), None


P1 = board("C4 D3 E4", "D4")
P2 = board("B3 C3 E3 F3", "C2 C4 E2 E4")
P3 = board("C3 C4 E5 F4 G5", "B3 B4 C2 D3 D4 F5")
K1 = board("C4 D3 E4", "D4 C5 E5 D6")
EYES = board("B2 C2 D2 E2 F2 B3 D3 F3 B4 C4 D4 E4 F4")


def verify():
    report = {"method": "Independent Python coordinate/set implementation", "puzzles": {}}
    for name, initial in [("P1", P1), ("P2", P2), ("P3", P3)]:
        rows = []
        for p in POINTS:
            if p in initial:
                continue
            c = coord(p)
            after, captured, error = play(initial, c, "B")
            row = {"black": c, "legal": error is None, "captured_by_black": captured}
            if error:
                row["rejection"] = error
                row["goal"] = False
            elif name == "P1":
                row["goal"] = point("D4") not in after
            elif name == "P2":
                stones, liberties = group(after, point("B3"))
                row["goal"] = point("F3") in stones and not captured
                if row["goal"]:
                    row["liberties"] = sorted(map(coord, liberties))
                    row["connected_stones"] = sorted(map(coord, stones))
            else:
                reply = "F6" if c == "C5" else "C5"
                final, reply_capture, reply_error = play(after, reply, "W")
                assert reply_error is None, (c, reply, reply_error)
                row.update({"white_reply": reply, "reply_legal": True,
                            "captured_by_white": reply_capture,
                            "goal": all(final.get(point(q)) == "B" for q in ["C3", "C4"])})
            rows.append(row)
        winners = [r["black"] for r in rows if r["goal"]]
        assert winners == {"P1": ["D5"], "P2": ["D3"], "P3": ["C5"]}[name], winners
        report["puzzles"][name] = {
            "empty_first_points": len(rows), "legal_first_moves": sum(r["legal"] for r in rows),
            "goal_moves": winners, "first_moves": rows}

    connected, removed, error = play(P2, "D3", "B")
    assert error is None and removed == []
    stones, liberties = group(connected, point("D3"))
    assert len(stones) == 5
    assert set(map(coord, liberties)) == set("A3 B2 B4 D2 D4 F2 F4 G3".split())

    alternative, _, error = play(P2, "D4", "B")
    assert error is None
    alternative, _, error = play(alternative, "D3", "W")
    assert error is None
    assert point("F3") not in group(alternative, point("B3"))[0]

    l_shape = board("D3 D4 E4 F5")
    stones, liberties = group(l_shape, point("D4"))
    assert set(map(coord, stones)) == {"D3", "D4", "E4"}
    assert set(map(coord, liberties)) == {"C3", "D2", "E3", "C4", "D5", "E5", "F4"}
    report["L_shape"] = {"stones": sorted(map(coord, stones)), "shared_liberties": sorted(map(coord, liberties)), "F5_is_separate": True}

    for c, expected in [("D4", 4), ("A4", 3), ("A1", 2)]:
        assert len(group(board(c), point(c))[1]) == expected
    report["single_stones"] = {c: sorted(map(coord, group(board(c), point(c))[1])) for c in ["D4", "A4", "A1"]}

    for c in ["C3", "E3"]:
        result, removed, error = play(EYES, c, "W")
        assert result is None and removed == [] and error == "suicide"
    report["eyes"] = {"C3": "suicide; original board unchanged", "E3": "suicide; original board unchanged"}

    captured, removed, error = play(K1, "D5", "B")
    assert error is None and removed == ["D4"]
    hypothetical, removed, error = play(captured, "D4", "W")
    assert error is None and removed == ["D5"] and hypothetical == K1
    rejected, removed, error = play(captured, "D4", "W", forbidden=K1)
    assert rejected is None and error == "repetition"
    report["ko"] = {"black_D5_captures": ["D4"], "hypothetical_white_D4_captures": ["D5"], "hypothetical_equals_initial": True, "with_history": "rejected"}
    return report


if __name__ == "__main__":
    report = verify()
    destination = Path(__file__).resolve().parents[1] / "docs" / "reference-enumeration.json"
    destination.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: {field: value for field, value in v.items() if field != "first_moves"}
                      for k, v in report["puzzles"].items()}, indent=2))
    print("Independent adjacency, P2 branch, eyes, capture-first, and K1 checks passed.")
    print("Evidence:", destination)
