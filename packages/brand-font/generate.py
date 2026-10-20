"""Youj Display (draft): a display face grown from the wordmark's four letters.

Every glyph is built from the wordmark's parts on its 24-unit grid (see DESIGN.md):
rectilinear outlines whose corners are sharp, the outer bend or the inner bend,
plus straight diagonals where a letter can't do without one. y, o, u and j are
the logo's own outlines, copied verbatim.

    python3 generate.py OUT_DIR      # needs fonttools, skia-pathops, brotli
"""

import json
import math
import os
import sys

import pathops
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path
from fontTools.ttLib import TTFont

# ---------------------------------------------------------------- the grid
U = 100  # font units per grid unit: UPM 2000, ascender 16 -> 1600, descender -4 -> -400
S = 2.19  # stem (vertical stroke)
H = 1.95  # bar (horizontal stroke)
XH = 11.43  # x-height
ASC = 16.0  # ascender: the tittle's top
DESC = -4.0  # descender: the y and j's hook
CAP = 15.2  # cap height, a step between x-height and ascender
W = 9.87  # the lowercase box (y, o, u)
TAIL = 5.59  # the hook's reach from the stem's outer edge
LIFT = 1.25  # the y's bowl lifted off the baseline
TIT = 2.33  # the tittle: a square
SB_STEM, SB_ROUND, SB_DIAG = 1.03, 0.75, 0.35

# bends: (along a horizontal edge, along a vertical edge, horizontal handle, vertical handle),
# measured from the corner point, exactly as the logo's o draws them
BENDS = {'o': (2.59, 3.2, 1.20, 0.75), 'i': (0.55, 1.2, 0.10, 0.40)}

# the mid bar shared by e, s, a, hyphen: two equal counters in the x-height
MID = (XH - H) / 2  # bottom of the mid bar (4.74); top is MID + H (6.69)
CMID = (CAP - H) / 2  # the same for capitals and figures


# ---------------------------------------------------------------- primitives
def poly(pts):
    """A closed outline through (x, y, tag) points in grid units. Tags: 's' sharp, 'o' outer bend,
    'i' inner bend, or (kind, scale) for a bend shrunk to fit a short edge."""
    n = len(pts)
    segs = []
    for k in range(n):
        x, y, tag = pts[k]
        if tag == 's':
            segs.append(('L', (x, y)))
            continue
        if isinstance(tag, tuple) and tag[0] == 'c':  # a custom bend: ('c', along h, along v, h handle, v handle)
            bh, bv, hh, hv = tag[1:]
        else:
            kind, f = (tag, 1.0) if isinstance(tag, str) else tag
            bh, bv, hh, hv = (v * f for v in BENDS[kind])
        px, py, _ = pts[k - 1]
        nx, ny, _ = pts[(k + 1) % n]
        din = (_sign(x - px), _sign(y - py))
        dout = (_sign(nx - x), _sign(ny - y))
        assert 0 in din and 0 in dout, f'bend on a diagonal at {x},{y}'
        lin, hin = (bh, hh) if din[1] == 0 else (bv, hv)
        lout, hout = (bh, hh) if dout[1] == 0 else (bv, hv)
        start = (x - din[0] * lin, y - din[1] * lin)
        c1 = (x - din[0] * hin, y - din[1] * hin)
        c2 = (x + dout[0] * hout, y + dout[1] * hout)
        end = (x + dout[0] * lout, y + dout[1] * lout)
        segs.append(('C', start, c1, c2, end))
    p = pathops.Path()
    pen = p.getPen()
    first = segs[0][1]
    pen.moveTo(_fu(first))
    for s in segs:
        if s[0] == 'L':
            pen.lineTo(_fu(s[1]))
        else:
            pen.lineTo(_fu(s[1]))
            pen.curveTo(_fu(s[2]), _fu(s[3]), _fu(s[4]))
    pen.closePath()
    return p


def _sign(v):
    return 0 if abs(v) < 1e-9 else (1 if v > 0 else -1)


def _fu(pt):
    return (round(pt[0] * U, 3), round(pt[1] * U, 3))


def box(x0, y0, x1, y1, tl='s', tr='s', br='s', bl='s'):
    return poly([(x0, y1, tl), (x1, y1, tr), (x1, y0, br), (x0, y0, bl)])


def rect(x0, y0, x1, y1):
    return box(x0, y0, x1, y1)


def stem(x, y0, y1):
    return rect(x, y0, x + S, y1)


def sq(x, y, s=TIT):
    return rect(x, y, x + s, y + s)


def ring(x0, y0, x1, y1, corners='oooo', inner='iiii', sx=S, sy=H):
    """A bowl: a box with its counter cut, the counter inset a stem across and a bar down."""
    return D(box(x0, y0, x1, y1, *corners), box(x0 + sx, y0 + sy, x1 - sx, y1 - sy, *inner))


def diag(xb, yb, xt, yt, t=S * 0.94):
    """A straight stroke between two centre points, cut flat (horizontally) at both ends, its
    thickness measured square to the stroke."""
    dx, dy = xt - xb, yt - yb
    hw = t * math.hypot(dx, dy) / abs(dy) / 2
    return poly([(xb - hw, yb, 's'), (xt - hw, yt, 's'), (xt + hw, yt, 's'), (xb + hw, yb, 's')])


def diag_hw(xb, yb, xt, yt, t=S * 0.94):
    return t * math.hypot(xt - xb, yt - yb) / abs(yt - yb) / 2


def U_(*ps):
    out = ps[0]
    for p in ps[1:]:
        out = pathops.op(out, p, pathops.PathOp.UNION)
    return out


def D(a, *bs):
    for b in bs:
        a = pathops.op(a, b, pathops.PathOp.DIFFERENCE)
    return a


def I(a, b):
    return pathops.op(a, b, pathops.PathOp.INTERSECTION)


def band(p, y0=0, y1=XH, x0=-50, x1=50):
    return I(p, rect(x0, y0, x1, y1))


def xform(p, m):
    q = pathops.Path()
    p.draw(TransformPen(q.getPen(), m))
    return pathops.simplify(q)


def mirror(p, w):
    return xform(p, (-1, 0, 0, 1, w * U, 0))


def rot(p, w, h):
    return xform(p, (-1, 0, 0, -1, w * U, h * U))


def shift(p, dx, dy=0):
    return xform(p, (1, 0, 0, 1, dx * U, dy * U))


def big_bend(bh, bv, soft=None):
    """A bend stretched to reach (bh, bv): handles in the logo's outer-bend proportions, or, with `soft`, set that
    fraction of the reach back from the corner (higher is rounder, closer to a diagonal)."""
    if soft:
        return ('c', bh, bv, bh * soft, bv * soft)
    return ('c', bh, bv, bh * 1.20 / 2.59, bv * 0.75 / 3.2)


def paren(w, h, arm=0.5, soft=0.72):
    """A ')' built from two stretched bends: arms flat at the left corners, the bowl swinging right to touch
    x = w at half height. Two of these back to back make the x; one against a stem makes the k."""
    ci = w - S
    bo = big_bend(w - arm, h / 2, soft)
    bi = big_bend(ci - arm, h / 2 - H, soft)
    return poly([(0, h, 's'), (w, h, bo), (w, 0, bo), (0, 0, 's'), (0, H, 's'), (ci, H, bi), (ci, h - H, bi), (0, h - H, 's')])


# ---------------------------------------------------------------- the corner rule, enforced on every built glyph
CUT_MAX = 3.6 * U  # a stroke's end is no wider than this
DIAG_BEND = {'o': (1.8, 0.7), 'i': (0.9, 0.3)}  # along a diagonal edge: reach, handle


def _unit(dx, dy):
    d = math.hypot(dx, dy)
    return (dx / d, dy / d) if d > 1e-9 else (0.0, 0.0)


def _segments(p):
    from fontTools.pens.recordingPen import RecordingPen
    rec = RecordingPen()
    p.draw(rec)
    contours, segs, start, last = [], None, None, None
    for op_, args in rec.value:
        if op_ == 'moveTo':
            segs, start, last = [], args[0], args[0]
        elif op_ == 'lineTo':
            if math.dist(last, args[0]) > 0.5:
                segs.append(['L', last, args[0]])
            last = args[0]
        elif op_ == 'curveTo':
            segs.append(['C', last, *args])
            last = args[-1]
        elif op_ in ('closePath', 'endPath'):
            if math.dist(last, start) > 0.5:
                segs.append(['L', last, start])
            # merge collinear lines
            merged = []
            for s in segs:
                if merged and s[0] == 'L' and merged[-1][0] == 'L':
                    a = _unit(merged[-1][2][0] - merged[-1][1][0], merged[-1][2][1] - merged[-1][1][1])
                    b = _unit(s[2][0] - s[1][0], s[2][1] - s[1][1])
                    if abs(a[0] * b[1] - a[1] * b[0]) < 1e-3 and a[0] * b[0] + a[1] * b[1] > 0:
                        merged[-1][2] = s[2]
                        continue
                merged.append(s)
            if len(merged) > 1 and merged[0][0] == 'L' and merged[-1][0] == 'L':
                a = _unit(merged[-1][2][0] - merged[-1][1][0], merged[-1][2][1] - merged[-1][1][1])
                b = _unit(merged[0][2][0] - merged[0][1][0], merged[0][2][1] - merged[0][1][1])
                if abs(a[0] * b[1] - a[1] * b[0]) < 1e-3 and a[0] * b[0] + a[1] * b[1] > 0:
                    merged[0][1] = merged[-1][1]
                    merged.pop()
            contours.append(merged)
    return contours


def _dir_out(s):
    p0 = s[1]
    for q in s[2:]:
        if math.dist(p0, q) > 1e-6:
            return _unit(q[0] - p0[0], q[1] - p0[1])
    return (0.0, 0.0)


def _dir_in(s):
    pts = s[1:]
    end = pts[-1]
    for q in reversed(pts[:-1]):
        if math.dist(q, end) > 1e-6:
            return _unit(end[0] - q[0], end[1] - q[1])
    return (0.0, 0.0)


def soften(p):
    """Every corner between two straight edges turns on the logo's bends: convex corners on the outer bend,
    concave ones on the inner bend, unless the corner belongs to a stroke's end (a short edge square to both
    neighbours, convex at both ends), which stays a flat cut. Diagonal edges take a proportional fillet.
    Bends shrink to fit short edges."""
    contours = _segments(p)
    if not contours:
        return p

    def area(c):
        pts = [s[1] for s in c]
        return sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts))) / 2

    fill_left = area(max(contours, key=lambda c: abs(area(c)))) > 0
    out = pathops.Path()
    pen = out.getPen()
    for c in contours:
        n = len(c)
        info = []  # per vertex k (end of seg k): (convex, din, dout) or None
        for k in range(n):
            a, b = c[k], c[(k + 1) % n]
            din, dout = _dir_in(a), _dir_out(b)
            cr = din[0] * dout[1] - din[1] * dout[0]
            if abs(cr) < 0.05:
                info.append(None)
                continue
            info.append(((cr > 0) == fill_left, din, dout, a[0] == 'L' and b[0] == 'L'))

        def is_cut_edge(k):  # seg k is a stroke's end
            s = c[k]
            if s[0] != 'L' or math.dist(s[1], s[2]) > CUT_MAX:
                return False
            ends = [info[(k - 1) % n], info[k]]
            if not all(e and e[0] for e in ends):
                return False
            return all(abs(e[1][0] * e[2][0] + e[1][1] * e[2][1]) < 0.6 for e in ends)

        cut = [is_cut_edge(k) for k in range(n)]
        want = [None] * n
        for k in range(n):
            e = info[k]
            if not e or not e[3] or cut[k] or cut[(k + 1) % n]:
                continue
            convex, din, dout, _ = e
            kind = 'o' if convex else 'i'

            def reach(d):
                if abs(d[1]) < 1e-3:
                    return BENDS[kind][0] * U, BENDS[kind][2] * U
                if abs(d[0]) < 1e-3:
                    return BENDS[kind][1] * U, BENDS[kind][3] * U
                return DIAG_BEND[kind][0] * U, DIAG_BEND[kind][1] * U

            want[k] = [*reach(din), *reach(dout)]
        # fit: each line shares its length between the bends at its two ends
        scale = [1.0] * n
        for k in range(n):
            s = c[k]
            if s[0] != 'L':
                continue
            ln = math.dist(s[1], s[2])
            need = (want[(k - 1) % n][2] if want[(k - 1) % n] else 0) + (want[k][0] if want[k] else 0)
            if need > ln * 0.98:
                f = ln * 0.98 / need
                scale[(k - 1) % n] = min(scale[(k - 1) % n], f)
                scale[k] = min(scale[k], f)
        bend = [None] * n
        for k in range(n):
            if not want[k]:
                continue
            f = scale[k]
            lin, hin, lout, hout = (v * f for v in want[k])
            _, din, dout, _ = info[k]
            v = c[k][-1]
            bend[k] = ((v[0] - din[0] * lin, v[1] - din[1] * lin), (v[0] - din[0] * hin, v[1] - din[1] * hin),
                       (v[0] + dout[0] * hout, v[1] + dout[1] * hout), (v[0] + dout[0] * lout, v[1] + dout[1] * lout))
        start = bend[n - 1][3] if bend[n - 1] else c[0][1]
        pen.moveTo(start)
        for k in range(n):
            s = c[k]
            end = bend[k][0] if bend[k] else s[-1]
            if s[0] == 'L':
                pen.lineTo(end)
            else:
                pen.curveTo(s[2], s[3], end)
            if bend[k]:
                pen.curveTo(bend[k][1], bend[k][2], bend[k][3])
        pen.closePath()
    return pathops.simplify(out)


def hook(xr, yt, reach=TAIL):
    """The y and j's stem running down into the hook: right edge at xr, from yt to the descender."""
    return poly([(xr - S, yt, 's'), (xr, yt, 's'), (xr, DESC, 'o'), (xr - reach, DESC, 's'),
                 (xr - reach, DESC + H, 's'), (xr - S, DESC + H, 'i')])


def foot(x, yt, reach):
    """A stem bending into a foot to the right at the baseline (t, l): the hook turned over."""
    return poly([(x, yt, 's'), (x + S, yt, 's'), (x + S, H, 'i'), (x + reach, H, 's'),
                 (x + reach, 0, 's'), (x, 0, 'o')])


def tittle_over(x_stem):
    return sq(x_stem + S / 2 - TIT / 2, ASC - TIT)


# ---------------------------------------------------------------- the logo, verbatim
LOGO = {
    'y': (0.0, ['M0 8.57H2.19V15.6C2.19 16.4 2.29 16.8 2.74 16.8H7.13C7.58 16.8 7.68 16.4 7.68 15.6V8.57H9.87V20.8C9.87 23.25 8.67 24 7.28 24H4.28V22.05H7.13C7.58 22.05 7.68 21.65 7.68 20.85V18.75H2.59C1.2 18.75 0 18 0 15.55Z']),
    'o': (11.65, ['M14.24 8.57H18.93C20.32 8.57 21.52 9.32 21.52 11.77V16.8C21.52 19.25 20.32 20 18.93 20H14.24C12.85 20 11.65 19.25 11.65 16.8V11.77C11.65 9.32 12.85 8.57 14.24 8.57Z',
                  'M14.39 10.52C13.94 10.52 13.84 10.92 13.84 11.72V16.85C13.84 17.65 13.94 18.05 14.39 18.05H18.78C19.23 18.05 19.33 17.65 19.33 16.85V11.72C19.33 10.92 19.23 10.52 18.78 10.52Z']),
    'u': (23.27, ['M23.27 8.57H25.46V16.85C25.46 17.65 25.56 18.05 26.01 18.05H30.4C30.85 18.05 30.95 17.65 30.95 16.85V8.57H33.14V16.8C33.14 19.25 31.94 20 30.55 20H25.86C24.47 20 23.27 19.25 23.27 16.8Z']),
    'j': (35.2, ['M35.2 8.57H37.39V20.8C37.39 23.25 36.19 24 34.8 24H31.8V22.05H34.65C35.1 22.05 35.2 21.65 35.2 20.85Z']),
}
LOGO_TITTLE = (35.13, 4.0, TIT)  # x, y (grid, y down), size


def logo_contours(ch):
    """The letter's outlines moved onto the glyph's origin (its box's left edge) and flipped y-up,
    drawn unchanged (no boolean pass), so the font reproduces the wordmark exactly."""
    x0, ds = LOGO[ch]
    m = (U, 0, 0, -U, -x0 * U, 20 * U)
    out = list(ds)
    if ch == 'j':
        tx, ty, s = LOGO_TITTLE
        out.append(f'M{tx} {ty}H{tx + s}V{ty + s}H{tx}Z')
    return [(d, m) for d in out]


# ---------------------------------------------------------------- lowercase
G = {}  # name -> dict(path | raw, box, sb=(l, r), uni)


SOFT = True  # the corner rule; punctuation opts out (kept as drawn)


def glyph(name, uni, box_w, sb, path=None, raw=None, soft=None):
    if path is not None and (SOFT if soft is None else soft):
        path = soften(path)
    G[name] = dict(path=path, raw=raw, box=box_w, sb=sb, uni=uni)


VARIANTS = []  # (label, glyph name, code point) for the variants specimen; alternates live in the private use area


def variant(name, label, box_w, sb, path, default=False):
    """An alternate drawn into the private use area; the default one is also the letter itself."""
    cp = 0xE000 + len(VARIANTS)
    glyph(f'{name}.{label}', cp, box_w, sb, path)
    VARIANTS.append((name, label, cp, default))
    if default:
        G[name] = dict(G[f'{name}.{label}'], uni=name)


R, T, Dg = SB_ROUND, SB_STEM, SB_DIAG

for ch, sb in {'y': (T, T), 'o': (0.75, 0.72), 'u': (T, T), 'j': (T, T)}.items():
    glyph(ch, ord(ch), S if ch == 'j' else W, sb, raw=logo_contours(ch))

# n is the u turned over; h and the bowls keep their stems square where a stem runs on
glyph('n', 'n', W, (T, T), D(box(0, 0, W, XH, 'o', 'o'), box(S, -1, W - S, XH - H, 'i', 'i')))
glyph('h', 'h', W, (T, T), U_(D(box(0, 0, W, XH, 's', 'o'), box(S, -1, W - S, XH - H, 'i', 'i')), stem(0, 0, ASC)))
MW = 3 * S + 2 * 4.45
glyph('m', 'm', MW, (T, T), D(box(0, 0, MW, XH, 'o', 'o'),
                               box(S, -1, S + 4.45, XH - H, 'i', 'i'),
                               box(2 * S + 4.45, -1, MW - S, XH - H, 'i', 'i')))
b_ = U_(ring(0, 0, W, XH, 'soos'), stem(0, 0, ASC))
glyph('b', 'b', W, (T, R), b_)
glyph('d', 'd', W, (R, T), mirror(b_, W))
p_ = U_(ring(0, 0, W, XH, 'soos'), stem(0, DESC, XH))
glyph('p', 'p', W, (T, R), p_)
glyph('q', 'q', W, (R, T), mirror(p_, W))
# g: the y's construction with the bowl closed
glyph('g', 'g', W, (R, T), U_(ring(0, LIFT, W, XH, 'osso'), hook(W, XH)))
CW_ = 9.4
glyph('c', 'c', CW_, (R, R), D(box(0, 0, CW_, XH, 'o', 's', 's', 'o'), box(S, H, CW_ + 1, XH - H, 'i', 's', 's', 'i')))
# e: the o with a mid bar; the lower right opens, the foot cut flat at the box's edge
glyph('e', 'e', W, (R, R), D(box(0, 0, W, XH, 'o', 'o', 's', 'o'),
                              box(S, MID + H, W - S, XH - H, 'i', 'i', 'i', 'i'),
                              box(S, H, W + 1, MID, 'i', 's', 's', 'i')))
# a: two storeys, the bowl the height of the e's eye turned down, the arm cut flat
A0 = 0.9
glyph('a', 'a', W, (R, T), U_(
    poly([(A0, XH, 's'), (W, XH, 'o'), (W, 0, 's'), (W - S, 0, 's'), (W - S, XH - H, 'i'), (A0, XH - H, 's')]),
    D(box(0, 0, W, MID + H, 'o', 's', 's', 'o'), box(S, H, W - S, MID, 'i', 'i', 'i', 'i'))))
# s: three bars, two stems, cut flat at both ends
SW = 9.4


def s_shape(w, h, mid, kv=1.0):
    o = ('o', kv)
    return poly([(w, h, 's'), (0, h, o), (0, mid, o), (w - S, mid, 'i'), (w - S, H, 'i'), (0, H, 's'),
                 (0, 0, 's'), (w, 0, o), (w, mid + H, o), (S, mid + H, 'i'), (S, h - H, 'i'), (w, h - H, 's')])


glyph('s', 's', SW, (R, R), s_shape(SW, XH, MID, 0.92))
RW = 6.3
glyph('r', 'r', RW, (T, 0.4), poly([(0, 0, 's'), (0, XH, 'o'), (RW, XH, 's'), (RW, XH - H, 's'), (S, XH - H, 'i'), (S, 0, 's')]))
glyph('i', 'i', S, (T, T), U_(stem(0, 0, XH), tittle_over(0)))
glyph('l', 'l', 4.4, (T, 0.5), foot(0, ASC, 4.4))
TW, TS = 6.6, 1.6
glyph('t', 't', TW, (0.4, 0.5), U_(foot(TS, XH + 2.6, TW - TS), rect(0, XH - H, TW - 0.5, XH)))
FW, FS = 6.4, 1.6
glyph('f', 'f', FW, (0.4, 0.3), U_(poly([(FS, 0, 's'), (FS, ASC, 'o'), (FW, ASC, 's'), (FW, ASC - H, 's'), (FS + S, ASC - H, 'i'), (FS + S, 0, 's')]),
                                    rect(0, XH - H, FW - 0.5, XH)))


def k_diag(w, h, asc):
    hw = diag_hw(0, 0, 1, 1.25)
    a0, a1 = (S + 0.2, h * 0.28), (w - hw, h + 0.6)
    j = (a0[0] + 0.42 * (a1[0] - a0[0]), a0[1] + 0.42 * (a1[1] - a0[1]))
    arm = diag(*a0, *a1)
    # the leg runs from the baseline up into the arm, trimmed at the arm's centre line so the join has no notch
    lx, ly = w - hw, -0.6
    f = 1 + 4 / (j[1] - ly)
    leg = diag(lx, ly, lx + (j[0] - lx) * f, ly + (j[1] - ly) * f)
    ux, uy = a1[0] - a0[0], a1[1] - a0[1]
    below = poly([(a0[0] - ux * 3, a0[1] - uy * 3, 's'), (a1[0] + ux * 3, a1[1] + uy * 3, 's'), (w + 30, -30, 's'), (-30, -30, 's')])
    leg = I(leg, below)
    return U_(stem(0, 0, asc), band(U_(arm, leg), 0, h, S - 0.3, w + 2))


def k_curve(w, h, asc, overlap=0.5 * S):
    """The stem with a '(' leaning on it: the x's right half, its waist sunk into the stem."""
    pw = w - (S - overlap)
    return U_(stem(0, 0, asc), shift(mirror(paren(pw, h), pw), S - overlap))


def v_diag(w, h):
    return band(U_(diag(w / 2, 0, diag_hw(w / 2, 0, 0, h), h), diag(w / 2, 0, w - diag_hw(w / 2, 0, 0, h), h)), 0, h)


def v_u(w, h, start=0.5, base=0.34, t=S * 0.95):
    """The u with its sides narrowing to a short flat base: stems down to `start`, then straight in."""
    y1, xo = h * start, w / 2 - w * base / 2
    L = math.hypot(xo, y1)
    d, nrm = (xo / L, -y1 / L), (y1 / L, xo / L)  # along the outer diagonal, and inward
    sx = (S - t * nrm[0]) / d[0]
    yi = y1 + t * nrm[1] + sx * d[1]  # inner diagonal meets the stem's inner side
    sy = (H - y1 - t * nrm[1]) / d[1]
    xi = t * nrm[0] + sy * d[0]  # ... and the base's top
    xi = min(xi, w / 2 - 0.35)
    return poly([(0, h, 's'), (S, h, 's'), (S, yi, 's'), (xi, H, 's'), (w - xi, H, 's'), (w - S, yi, 's'), (w - S, h, 's'),
                 (w, h, 's'), (w, y1, 's'), (w - xo, 0, 's'), (xo, 0, 's'), (0, y1, 's')])


def x_diag(w, h):
    hw = diag_hw(0, 0, w, h)
    return band(U_(diag(hw, 0, w - hw, h), diag(w - hw, 0, hw, h)), 0, h)


def x_curve(w, h, waist=S):
    """Two bends-built brackets back to back, ')(' pushed together until their bowls kiss."""
    left = paren(w / 2 + waist / 2, h)
    return U_(left, mirror(left, w))


def _slash(x0, x1, h, t=S):
    """Horizontal width of a stroke whose outer edges run from (x0, 0) up to (x1, h), t thick."""
    ww = t
    for _ in range(8):
        ww = t * math.hypot(x1 - x0 - ww, h) / h
    return ww


def z_diag(w, h):
    """One outline: the diagonal leaves the top bar at the top-right corner and lands on the bottom bar at the
    bottom-left one, so both turns are bends and both crotches inner bends (the corner rule rounds them)."""
    ww = _slash(0, w, h)
    xr = ww + H * (w - ww) / h
    xl = (h - H) * (w - ww) / h
    return poly([(0, h, 's'), (w, h, 's'), (xr, H, 's'), (w, H, 's'), (w, 0, 's'), (0, 0, 's'), (xl, h - H, 's'), (0, h - H, 's')])


def z_bent(w, h):
    """The 2's construction: bars and stems turned on bends, no diagonal."""
    mid = (h - H) / 2
    return poly([(0, h, 's'), (w, h, 'o'), (w, mid, 'o'), (S, mid, 'i'), (S, H, 'i'), (w, H, 's'), (w, 0, 's'),
                 (0, 0, 'o'), (0, mid + H, 'o'), (w - S, mid + H, 'i'), (w - S, h - H, 'i'), (0, h - H, 's')])


variant('k', 'diag', 9.0, (T, Dg), k_diag(9.0, XH, ASC))
variant('k', 'curve', 9.0, (T, 0.6), k_curve(9.0, XH, ASC), default=True)
variant('v', 'diag', W, (Dg, Dg), v_diag(W, XH))
variant('v', 'u', W, (0.8, 0.8), v_u(W, XH), default=True)
variant('x', 'diag', 9.4, (Dg, Dg), x_diag(9.4, XH))
variant('x', 'curve', 9.4, (0.6, 0.6), x_curve(9.4, XH), default=True)
variant('z', 'diag', 9.0, (0.7, 0.7), z_diag(9.0, XH), default=True)
variant('z', 'bent', 9.0, (0.7, 0.7), z_bent(9.0, XH))
# w: the m turned over, as the y is the u lifted
glyph('w', 'w', MW, (T, T), rot(G['m']['path'], MW, XH), soft=False)

# ---------------------------------------------------------------- capitals
CWD = 11.0  # straight capitals
OWD = 11.8  # round capitals
glyph('A', 'A', CWD, (T, T), D(box(0, 0, CWD, CAP, 'o', 'o'), box(S, CMID - 0.6 + H, CWD - S, CAP - H, 'i', 'i', 'i', 'i'),
                                box(S, -1, CWD - S, CMID - 0.6, 'i', 'i')))
BM = CMID + 0.3
# B: its spine's corners take a tight bend (0.4 of the outer one), so it doesn't read as 8 at text sizes
BS = ('o', 0.4)
glyph('B', 'B', CWD, (T, R), U_(ring(0, BM, CWD - 0.5, CAP, [BS, 'o', 'o', 's']), ring(0, 0, CWD, BM + H, ['s', 'o', 'o', BS])))
glyph('C', 'C', OWD - 0.4, (R, R), D(box(0, 0, OWD - 0.4, CAP, 'o', 's', 's', 'o'), box(S, H, OWD + 1, CAP - H, 'i', 's', 's', 'i')))
# D: the O with its right side swung wider, so the two stay apart now that every corner bends
DB, DBI = big_bend(5.2, 6.4), big_bend(5.2 - S, 6.4 - H)
glyph('D', 'D', OWD, (T, R), D(box(0, 0, OWD, CAP, 'o', DB, DB, 'o'), box(S, H, OWD - S, CAP - H, 'i', DBI, DBI, 'i')))
EW = 9.6


def e_cap(w, bottom=True):
    p = D(rect(0, 0, w, CAP), box(S, CMID + H, w + 1, CAP - H, 'i', 's', 's', 'i'), rect(w - 0.9, CMID, w + 1, CMID + H))
    if bottom:
        return D(p, box(S, H, w + 1, CMID, 'i', 's', 's', 'i'))
    return D(p, box(S, -1, w + 1, CMID, 'i'))


glyph('E', 'E', EW, (T, 0.6), e_cap(EW))
glyph('F', 'F', EW - 0.4, (T, 0.4), e_cap(EW - 0.4, bottom=False))
# G: the top bar turns down on a bend into a short spur cut flat; the bar comes in from the right stem
GY, GS, GX = CMID + H, 4.0, OWD - 4.4
glyph('G', 'G', OWD, (R, T), poly([(0, 0, 'o'), (0, CAP, 'o'), (OWD, CAP, 'o'), (OWD, CAP - GS, 's'), (OWD - S, CAP - GS, 's'),
                                   (OWD - S, CAP - H, 'i'), (S, CAP - H, 'i'), (S, H, 'i'), (OWD - S, H, 'i'), (OWD - S, GY - H, 'i'),
                                   (GX, GY - H, 's'), (GX, GY, 's'), (OWD, GY, 'o'), (OWD, 0, 'o')]))
glyph('H', 'H', CWD, (T, T), U_(stem(0, 0, CAP), stem(CWD - S, 0, CAP), rect(0, CMID, CWD, CMID + H)))
glyph('I', 'I', S, (T, T), stem(0, 0, CAP))
JW = 8.2
glyph('J', 'J', JW, (0.5, T), poly([(JW - S, CAP, 's'), (JW, CAP, 's'), (JW, 0, 'o'), (0, 0, 's'), (0, H, 's'), (JW - S, H, 'i')]))
variant('K', 'diag', 10.6, (T, Dg), k_diag(10.6, CAP, CAP))
variant('K', 'curve', 10.6, (T, 0.6), k_curve(10.6, CAP, CAP), default=True)
glyph('L', 'L', 8.6, (T, 0.5), D(rect(0, 0, 8.6, CAP), box(S, H, 9.6, CAP + 1, 's', 's', 's', 'i')))
MC = 3 * S + 2 * 5.0
glyph('M', 'M', MC, (T, T), D(box(0, 0, MC, CAP, 'o', 'o'), box(S, -1, S + 5.0, CAP - H, 'i', 'i'),
                               box(2 * S + 5.0, -1, MC - S, CAP - H, 'i', 'i')))
hwn = diag_hw(S, CAP, CWD - S, 0, S)
glyph('N', 'N', CWD, (T, T), U_(stem(0, 0, CAP), stem(CWD - S, 0, CAP), band(diag(CWD - hwn, 0, hwn, CAP, S), 0, CAP)))
glyph('O', 'O', OWD, (R, R), ring(0, 0, OWD, CAP))
PB = CMID
glyph('P', 'P', CWD - 0.4, (T, R), U_(ring(0, PB, CWD - 0.4, CAP, 'soos'), stem(0, 0, CAP)))
glyph('Q', 'Q', OWD, (R, R), U_(ring(0, 0, OWD, CAP), rect(OWD / 2 + 0.4, -2.4, OWD / 2 + 0.4 + S, H)))
hwr = diag_hw(5.2, PB, CWD, 0)
glyph('R', 'R', CWD, (T, Dg), U_(ring(0, PB, CWD - 0.4, CAP, 'soos'), stem(0, 0, CAP),
                                  band(diag(CWD - hwr, 0, 5.4, PB + 1.2), 0, PB + 0.5)))
glyph('S', 'S', 10.6, (R, R), s_shape(10.6, CAP, CMID))
glyph('T', 'T', 10.4, (0.5, 0.5), U_(rect(0, CAP - H, 10.4, CAP), stem(5.2 - S / 2, 0, CAP)))
glyph('U', 'U', CWD + 0.2, (T, T), D(box(0, 0, CWD + 0.2, CAP, 's', 's', 'o', 'o'), box(S, H, CWD + 0.2 - S, CAP + 1, 's', 's', 'i', 'i')))
variant('V', 'diag', 11.4, (Dg, Dg), v_diag(11.4, CAP))
variant('V', 'u', 11.4, (0.8, 0.8), v_u(11.4, CAP), default=True)
glyph('W', 'W', MC, (T, T), rot(G['M']['path'], MC, CAP), soft=False)
variant('X', 'diag', 11.0, (Dg, Dg), x_diag(11.0, CAP))
variant('X', 'curve', 11.0, (0.6, 0.6), x_curve(11.0, CAP), default=True)
# Y: the logo's y idea in capitals: a u standing on a stem
YW, YB = 11.2, CMID - 0.4
glyph('Y', 'Y', YW, (0.8, 0.8), U_(D(box(0, YB, YW, CAP, 's', 's', 'o', 'o'), box(S, YB + H, YW - S, CAP + 1, 's', 's', 'i', 'i')),
                                    stem(YW / 2 - S / 2, 0, YB + H)))
variant('Z', 'diag', 10.2, (0.7, 0.7), z_diag(10.2, CAP), default=True)
variant('Z', 'bent', 10.2, (0.7, 0.7), z_bent(10.2, CAP))

# ---------------------------------------------------------------- figures (tabular)
DW = W
DADV = DW + 2 * SB_STEM
FIG = {}
FIG['0'] = ring(0, 0, DW, CAP)
X1 = DW / 2 - S / 2 + 0.7
FIG['1'] = poly([(X1 - 3.0, CAP - H, 's'), (X1 - 3.0, CAP, 's'), (X1 + S, CAP, 's'), (X1 + S, 0, 's'), (X1, 0, 's'), (X1, CAP - H, 'i')])
FIG['2'] = poly([(0, CAP, 's'), (DW, CAP, 'o'), (DW, CMID, 'o'), (S, CMID, 'i'), (S, H, 'i'), (DW, H, 's'), (DW, 0, 's'),
                 (0, 0, 'o'), (0, CMID + H, 'o'), (DW - S, CMID + H, 'i'), (DW - S, CAP - H, 'i'), (0, CAP - H, 's')])
X3 = 2.4
FIG['3'] = poly([(0, CAP, 's'), (DW, CAP, 'o'), (DW, 0, 'o'), (0, 0, 's'), (0, H, 's'), (DW - S, H, 'i'), (DW - S, CMID, 'i'),
                 (X3, CMID, 's'), (X3, CMID + H, 's'), (DW - S, CMID + H, 'i'), (DW - S, CAP - H, 'i'), (0, CAP - H, 's')])
Y4, X4 = 4.6, DW - S - 0.9
FIG['4'] = U_(poly([(0, CAP, 's'), (S, CAP, 's'), (S, Y4 + H, 'i'), (DW, Y4 + H, 's'), (DW, Y4, 's'), (0, Y4, 'o')]), stem(X4, 0, CAP))
# 5: the S's bends, its bowl taller, and the stem running on past the bowl's corner in a short spur: the 5's join
M5, SP5 = CMID + 0.5, 1.7
FIG['5'] = poly([(DW, CAP, 's'), (0, CAP, 'o'), (0, M5 - SP5, 's'), (S, M5 - SP5, 's'), (S, M5, 'i'), (DW - S, M5, 'i'),
                 (DW - S, H, 'i'), (0, H, 's'), (0, 0, 's'), (DW, 0, 'o'), (DW, M5 + H, 'o'), (S, M5 + H, 'i'),
                 (S, CAP - H, 'i'), (DW, CAP - H, 's')])
six = U_(ring(0, 0, DW, CMID + H, 'sooo'),
         poly([(0, CMID, 's'), (0, CAP, 'o'), (DW, CAP, 's'), (DW, CAP - H, 's'), (S, CAP - H, 'i'), (S, CMID, 's')]))
FIG['6'] = six
FIG['9'] = rot(soften(six), DW, CAP)
# 7: the Z's top half: the bar turns into the diagonal on a bend at the top-right corner
X7 = 2.6
w7 = _slash(X7, DW, CAP)
FIG['7'] = poly([(0, CAP, 's'), (DW, CAP, 's'), (X7 + w7, 0, 's'), (X7, 0, 's'),
                 (X7 + (CAP - H) * (DW - w7 - X7) / CAP, CAP - H, 's'), (0, CAP - H, 's')])
FIG['8'] = U_(ring(0.35, CMID, DW - 0.35, CAP), ring(0, 0, DW, CMID + H))
for k_, p in FIG.items():
    glyph(k_, k_, DW, (SB_STEM, SB_STEM), p)

# ---------------------------------------------------------------- punctuation: the tittle is the dot
SOFT = False
glyph('period', '.', TIT, (T, T), sq(0, 0))
glyph('comma', ',', TIT, (T, T), U_(sq(0, 0), rect(TIT - 1.2, -2.0, TIT, 0.5)))
glyph('colon', ':', TIT, (T, T), U_(sq(0, 0), sq(0, XH - TIT)))
glyph('semicolon', ';', TIT, (T, T), U_(sq(0, 0), rect(TIT - 1.2, -2.0, TIT, 0.5), sq(0, XH - TIT)))
glyph('hyphen', '-', 5.6, (0.8, 0.8), rect(0, MID, 5.6, MID + H))
glyph('quotesingle', "'", S, (T, T), rect(0, CAP - 4.4, S, CAP))
glyph('quoteright', '’', TIT, (T, T), shift(U_(sq(0, 0), rect(TIT - 1.2, -2.0, TIT, 0.5)), 0, CAP - TIT))
glyph('quoteleft', '‘', TIT, (T, T), rot(U_(sq(0, 0), rect(TIT - 1.2, -2.0, TIT, 0.5)), TIT, CAP - 2.0))
glyph('exclam', '!', TIT, (T, T), U_(stem((TIT - S) / 2, 4.2, CAP), sq(0, 0)))
QW = 8.6
QX = QW / 2 - S / 2 - 0.4
glyph('question', '?', QW, (0.6, R), U_(
    poly([(0, CAP, 's'), (QW, CAP, 'o'), (QW, 6.4, ('o', 0.8)), (QX + S, 6.4, 'i'), (QX + S, 4.2, 's'), (QX, 4.2, 's'),
          (QX, 6.4 + H, 's'), (QW - S, 6.4 + H, 'i'), (QW - S, CAP - H, 'i'), (0, CAP - H, 's')]),
    sq(QX + S / 2 - TIT / 2, 0)))
glyph('ellipsis', '…', 3 * TIT + 2 * 1.6, (T, T), U_(sq(0, 0), sq(TIT + 1.6, 0), sq(2 * (TIT + 1.6), 0)))
glyph('endash', '–', 7.6, (0.6, 0.6), rect(0, MID, 7.6, MID + H))
AW = 15.0
AY0, AY1 = -2.6, CAP - 0.6  # the @'s ring
AI0, AI1, AIX = 1.6, 10.0, 10.6  # its a: bottom, top, the stem's right edge
glyph('at', '@', AW, (R, R), U_(
    D(ring(0, AY0, AW, AY1), rect(AW - 5.0, AY0 - 0.1, AW + 0.1, AI0)),
    D(box(3.8, AI0, AIX, AI1, 'o', 's', 's', 'o'), box(3.8 + S, AI0 + H, AIX - S, AI1 - H, 'i', 'i', 'i', 'i')),
    poly([(AIX - S, AI1, 's'), (AIX, AI1, 's'), (AIX, AI0 + H, 'i'), (AW - S, AI0 + H, 'i'), (AW - S, AI0 + H + 0.01, 's'),
          (AW, AI0 + H + 0.01, 's'), (AW, AI0, 's'), (AIX - S, AI0, 's')])))
AMP = 11.8
AM = CMID + 0.6  # the bottom of the upper loop
hwa = diag_hw(3.4, AM, AMP, 0)
glyph('ampersand', '&', AMP, (R, Dg), U_(
    ring(0.3, AM, 6.9, CAP),
    D(box(0, 0, 8.6, AM + H, 'o', 's', 'o', 'o'), box(S, H, 8.6 - S, AM + 2 * H, 's', 's', 'i', 'i'), rect(8.6 - S - 0.1, 5.8, 8.7, 20)),
    band(diag(AMP - hwa, 0, 3.0, AM + H), 0, AM + H)))
glyph('space', ' ', 0, (2.2, 2.2), pathops.Path())
glyph('nbspace', ' ', 0, (2.2, 2.2), pathops.Path())


# ---------------------------------------------------------------- kerning: only the worst pairs, in font units
# (y-o-u-j keep the logo's spacing: none of these pairs touch them)
KERN = '''
@round = [o c d e g q a s];
@lower = [o c d e g q a s m n p r u v w x y z];
@stops = [period comma ellipsis];
feature kern {
  pos T @round -180;  pos T [m n p r u v w x y z] -120;  pos T @stops -200;  pos T hyphen -140;
  pos Y @round -150;  pos Y [m n p r u v w x z] -100;  pos Y @stops -180;  pos Y hyphen -120;
  pos V @round -60;  pos V @stops -110;
  pos [P F] @stops -150;  pos [P F] @round -40;
  pos L [T Y] -160;  pos L V -70;  pos L quoteright -150;
  pos [r f] @stops -150;  pos [r f] @round -50;  pos [r f] hyphen -100;
  pos [@round m n u] T -120;  pos [@round m n u] Y -120;
  pos [g p q y j] j 160;
} kern;
'''


# ---------------------------------------------------------------- build
def place(g):
    """Contours in font units, offset by the left side bearing; the advance width."""
    lsb, rsb = g['sb']
    adv = round((lsb + g['box'] + rsb) * U)
    if g['raw']:
        out = pathops.Path()  # unused; raw drawn directly
        return adv, ('raw', [(d, (m[0], m[1], m[2], m[3], m[4] + lsb * U, m[5])) for d, m in g['raw']])
    return adv, ('path', shift(g['path'], lsb))


def draw_into(item, pen):
    kind, data = item
    if kind == 'raw':
        for d, m in data:
            parse_path(d, TransformPen(pen, m))
    else:
        data.draw(pen)


def build(out_dir):
    os.makedirs(os.path.join(out_dir, 'svg'), exist_ok=True)
    order = ['.notdef'] + list(G)
    placed = {n: place(G[n]) for n in G}
    fb = FontBuilder(2000, isTTF=False)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap({(ord(G[n]['uni']) if isinstance(G[n]['uni'], str) else G[n]['uni']): n for n in G})
    charstrings, metrics = {}, {}
    nd = T2CharStringPen(1000, None)
    for r in [(100, 0, 900, 1400)]:
        x0, y0, x1, y1 = r
        nd.moveTo((x0, y0)); nd.lineTo((x1, y0)); nd.lineTo((x1, y1)); nd.lineTo((x0, y1)); nd.closePath()
    charstrings['.notdef'] = nd.getCharString()
    metrics['.notdef'] = (1000, 100)
    for n in G:
        adv, item = placed[n]
        pen = T2CharStringPen(adv, None)
        draw_into(item, pen)
        charstrings[n] = pen.getCharString()
        b = pathops.Path()
        draw_into(item, b.getPen())
        bx = b.bounds
        metrics[n] = (adv, round(bx[0]) if b.points else 0)
        # per-glyph SVG, y down, the em box from ascender to descender
        sp = SVGPathPen(None)
        draw_into(item, TransformPen(sp, (1, 0, 0, -1, 0, 1600)))
        cp = ord(G[n]['uni']) if isinstance(G[n]['uni'], str) else G[n]['uni']
        # code point first: A and a would collide on a case-insensitive disk
        with open(os.path.join(out_dir, 'svg', f'{cp:04X}-{n}.svg'), 'w') as f:
            f.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {max(adv, 1)} 2000">'
                    f'<path d="{sp.getCommands()}" fill="currentColor"/></svg>\n')
    fb.setupCFF('YoujDisplay-Regular', {'FullName': 'Youj Display'}, charstrings, {})
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=1600, descent=-400)
    fb.setupNameTable({
        'familyName': 'Youj Display',
        'styleName': 'Regular',
        'fullName': 'Youj Display',
        'psName': 'YoujDisplay-Regular',
        'copyright': 'Copyright (c) 2026 louis-henry, with Reserved Font Name "Youj Display".',
        'licenseDescription': 'This Font Software is licensed under the SIL Open Font License, Version 1.1',
        'licenseInfoURL': 'https://openfontlicense.org',
    })
    fb.setupOS2(sTypoAscender=1600, sTypoDescender=-400, sTypoLineGap=0, usWinAscent=1700, usWinDescent=500,
                sxHeight=round(XH * U), sCapHeight=round(CAP * U), achVendID='YOUJ')
    fb.setupPost()
    addOpenTypeFeaturesFromString(fb.font, KERN)
    otf = os.path.join(out_dir, 'youj-display.otf')
    fb.save(otf)
    f = TTFont(otf)
    f.flavor = 'woff2'
    f.save(os.path.join(out_dir, 'youj-display.woff2'))
    with open(os.path.join(out_dir, 'variants.json'), 'w') as f:
        json.dump([dict(letter=n, label=l, cp=cp, default=d) for n, l, cp, d in VARIANTS], f, indent=1)
    print(f'{len(G)} glyphs -> {otf}')


if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv) > 1 else 'build')
