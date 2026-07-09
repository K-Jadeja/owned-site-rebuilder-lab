# Action Coverage Summary (CDP preciseCoverage)

Generated: 2026-07-09T10:21:39.510Z
Target: https://demo.reactvideoeditor.com

Coverage was collected via CDP `Profiler.startPreciseCoverage` with `detailed: true, callCount: true`.
For each action we report the bytes newly covered (delta from previous take) summed across all scripts.

| Action | Err | New covered bytes (positive) | Top script URL |
| --- | --- | --- | --- |
| boot | ok | 0 | – |
| dark-toggle | ok | 1500624 | – |
| export-dialog | ok | 1227870 | 180476bc-91ccc8fcb48478c4.js |
| playback-space | ok | 1075550 | 180476bc-91ccc8fcb48478c4.js |
| undo-redo | ok | 212629 | 4bd1b696-c023c6e3521b1417.js |
| zoom-in | ok | 689626 | 61-d3d99d30faface72.js |
| zoom-out | ok | 574278 | 4bd1b696-c023c6e3521b1417.js |
| zoom-reset | ok | 730290 | 61-d3d99d30faface72.js |
| my-library | ok | 118721 | – |

## Per-action top scripts (positive deltas)

### boot
- (no positive delta — script coverage reset between takes)

### dark-toggle
- (inline): +971866 bytes (611 functions)
  - (anon) @ 0-311362 called 1x
  - (anon) @ 10-311351 called 1x
  - __commonJS @ 80-407 called 0x
- 4bd1b696-c023c6e3521b1417.js: +238646 bytes (219 functions)
  - c @ 573-732 called 69x
  - c @ 629-640 called 7141x
  - c @ 640-708 called 0x
- 61-d3d99d30faface72.js: +131184 bytes (424 functions)
  - A @ 98-103 called 2x
  - s @ 321-651 called 4x
  - s @ 361-432 called 34x
- 55eb4b32-87960e808445d7a8.js: +89932 bytes (142 functions)
  - Bk @ 111-117 called 1x
  - UC @ 219-225 called 1x
  - _8 @ 239-245 called 1x
- (inline): +39264 bytes (26 functions)
  - (anon) @ 0-10652 called 1x
  - (anon) @ 8-10648 called 1x
  - __commonJS @ 78-405 called 0x
- 180476bc-91ccc8fcb48478c4.js: +15496 bytes (26 functions)
  - rx @ 37768-37879 called 4x
  - rx @ 37832-37850 called 10x
  - (anon) @ 38991-39146 called 1x
- 255-4ecccced1aaa83b0.js: +11257 bytes (33 functions)
  - S @ 15769-15861 called 103x
  - S @ 15844-15846 called 77x
  - S @ 15846-15851 called 26x
- (inline): +1899 bytes (2 functions)
  - (anon) @ 0-815 called 1x
  - (anon) @ 0-815 called 1x
  - (anon) @ 271-540 called 0x

### export-dialog
- 180476bc-91ccc8fcb48478c4.js: +418499 bytes (689 functions)
  - a @ 2412-2561 called 2x
  - a @ 2470-2479 called 0x
  - a @ 2488-2560 called 0x
- 61-d3d99d30faface72.js: +363163 bytes (880 functions)
  - A @ 98-103 called 3x
  - s @ 321-651 called 6x
  - s @ 361-432 called 51x
- 4bd1b696-c023c6e3521b1417.js: +254819 bytes (216 functions)
  - c @ 573-732 called 138x
  - c @ 629-640 called 15260x
  - c @ 640-708 called 0x
- 55eb4b32-87960e808445d7a8.js: +113188 bytes (192 functions)
  - BO @ 101-107 called 2x
  - Bk @ 111-117 called 1x
  - H1 @ 171-176 called 2x
- (inline): +48978 bytes (69 functions)
  - parseAttributeSelector @ 51302-56495 called 10x
  - parseAttributeSelector @ 56296-56316 called 0x
  - parseAttributeSelector @ 56336-56364 called 0x
- (inline): +15483 bytes (16 functions)
  - isRegExp @ 856-1027 called 10x
  - isRegExp @ 988-1025 called 0x
  - isDate @ 1028-1193 called 10x
- 255-4ecccced1aaa83b0.js: +11490 bytes (31 functions)
  - S @ 15769-15861 called 517x
  - S @ 15844-15846 called 276x
  - S @ 15846-15851 called 241x
- (inline): +1994 bytes (2 functions)
  - (anon) @ 0-815 called 10x
  - (anon) @ 0-815 called 10x
  - (anon) @ 271-540 called 0x

### playback-space
- 180476bc-91ccc8fcb48478c4.js: +405478 bytes (690 functions)
  - getAssetIdForUrl @ 16357-16436 called 10x
  - getAssetIdForUrl @ 16406-16424 called 0x
  - rh @ 35514-35673 called 4x
- 4bd1b696-c023c6e3521b1417.js: +262440 bytes (235 functions)
  - c @ 573-732 called 4206x
  - c @ 614-640 called 4074x
  - c @ 629-640 called 399386x
- 61-d3d99d30faface72.js: +229429 bytes (759 functions)
  - A @ 98-103 called 8x
  - s @ 321-651 called 16x
  - s @ 361-432 called 136x
- 55eb4b32-87960e808445d7a8.js: +132776 bytes (231 functions)
  - BO @ 101-107 called 38x
  - Bk @ 111-117 called 19x
  - H1 @ 171-176 called 38x
- (inline): +33443 bytes (26 functions)
  - (anon) @ 0-10652 called 1x
  - (anon) @ 8-10648 called 1x
  - __commonJS @ 78-405 called 0x
- 255-4ecccced1aaa83b0.js: +11643 bytes (32 functions)
  - S @ 15769-15861 called 1575x
  - S @ 15844-15846 called 961x
  - S @ 15846-15851 called 614x
- (inline): +142 bytes (1 functions)
  - listener @ 293346-293466 called 1x
  - listener @ 293437-293459 called 0x
- (inline): +120 bytes (2 functions)
  - (anon) @ 0-61 called 1x
  - (anon) @ 1-60 called 1x

### undo-redo
- 4bd1b696-c023c6e3521b1417.js: +191361 bytes (150 functions)
  - c @ 573-732 called 80x
  - c @ 629-640 called 7352x
  - c @ 640-708 called 0x
- 180476bc-91ccc8fcb48478c4.js: +10828 bytes (31 functions)
  - e @ 44366-44432 called 5x
  - e @ 44381-44431 called 0x
  - gh @ 796989-797856 called 2x
- (inline): +5253 bytes (7 functions)
  - parseEvaluationResultValue @ 2798-4559 called 1x
  - parseEvaluationResultValue @ 2927-2941 called 0x
  - parseEvaluationResultValue @ 3016-3043 called 0x
- 255-4ecccced1aaa83b0.js: +3771 bytes (12 functions)
  - S @ 15769-15861 called 4x
  - S @ 15844-15851 called 2x
  - t.createElement @ 19789-20154 called 4x
- 61-d3d99d30faface72.js: +1256 bytes (9 functions)
  - A @ 32255-32260 called 1x
  - e @ 37469-37615 called 70x
  - a @ 50233-50392 called 2x
- (inline): +120 bytes (2 functions)
  - (anon) @ 0-61 called 1x
  - (anon) @ 1-60 called 1x
- (inline): +40 bytes (2 functions)
  - (anon) @ 0-20 called 1x
  - (anon) @ 0-20 called 1x

### zoom-in
- 61-d3d99d30faface72.js: +257022 bytes (489 functions)
  - T @ 10998-11003 called 2x
  - n @ 11060-12388 called 177x
  - n @ 11177-11189 called 2x
- 4bd1b696-c023c6e3521b1417.js: +215313 bytes (177 functions)
  - c @ 573-732 called 94x
  - c @ 614-640 called 52x
  - c @ 629-640 called 5312x
- (inline): +105452 bytes (107 functions)
  - parseAttributeSelector @ 51302-56495 called 1x
  - parseAttributeSelector @ 56296-56316 called 0x
  - parseAttributeSelector @ 56336-56364 called 0x
- 55eb4b32-87960e808445d7a8.js: +47757 bytes (95 functions)
  - BO @ 101-107 called 2x
  - H1 @ 171-176 called 2x
  - HL @ 190-196 called 1x
- 180476bc-91ccc8fcb48478c4.js: +42004 bytes (80 functions)
  - createInput @ 9252-9839 called 1x
  - createInput @ 9333-9798 called 0x
  - rf @ 37501-37768 called 1x
- (inline): +15606 bytes (16 functions)
  - isRegExp @ 856-1027 called 2x
  - isRegExp @ 988-1025 called 0x
  - isDate @ 1028-1193 called 2x
- 255-4ecccced1aaa83b0.js: +3493 bytes (13 functions)
  - S @ 15769-15861 called 29x
  - S @ 15844-15846 called 19x
  - S @ 15846-15851 called 10x
- (inline): +1899 bytes (2 functions)
  - (anon) @ 0-815 called 1x
  - (anon) @ 0-815 called 1x
  - (anon) @ 271-540 called 0x

### zoom-out
- 4bd1b696-c023c6e3521b1417.js: +240112 bytes (199 functions)
  - c @ 573-732 called 70x
  - c @ 629-640 called 6306x
  - c @ 640-708 called 0x
- (inline): +105452 bytes (107 functions)
  - parseAttributeSelector @ 51302-56495 called 1x
  - parseAttributeSelector @ 56296-56316 called 0x
  - parseAttributeSelector @ 56336-56364 called 0x
- 61-d3d99d30faface72.js: +98375 bytes (287 functions)
  - n @ 11060-12388 called 308x
  - n @ 11177-11189 called 0x
  - n @ 11190-11301 called 0x
- 180476bc-91ccc8fcb48478c4.js: +60870 bytes (117 functions)
  - a @ 2412-2561 called 1x
  - a @ 2470-2479 called 0x
  - a @ 2488-2560 called 0x
- 55eb4b32-87960e808445d7a8.js: +47391 bytes (92 functions)
  - BO @ 101-107 called 2x
  - H1 @ 171-176 called 2x
  - HL @ 190-196 called 1x
- (inline): +15606 bytes (16 functions)
  - isRegExp @ 856-1027 called 2x
  - isRegExp @ 988-1025 called 0x
  - isDate @ 1028-1193 called 2x
- 255-4ecccced1aaa83b0.js: +3493 bytes (13 functions)
  - S @ 15769-15861 called 29x
  - S @ 15844-15846 called 19x
  - S @ 15846-15851 called 10x
- (inline): +1899 bytes (2 functions)
  - (anon) @ 0-815 called 1x
  - (anon) @ 0-815 called 1x
  - (anon) @ 271-540 called 0x

### zoom-reset
- 61-d3d99d30faface72.js: +256535 bytes (476 functions)
  - T @ 10998-11003 called 2x
  - n @ 11060-12388 called 378x
  - n @ 11177-11189 called 2x
- 4bd1b696-c023c6e3521b1417.js: +236921 bytes (197 functions)
  - c @ 573-732 called 54x
  - c @ 629-640 called 4412x
  - c @ 640-708 called 0x
- (inline): +105257 bytes (106 functions)
  - parseAttributeSelector @ 51302-56495 called 1x
  - parseAttributeSelector @ 56296-56316 called 0x
  - parseAttributeSelector @ 56336-56364 called 0x
- 180476bc-91ccc8fcb48478c4.js: +62228 bytes (112 functions)
  - a @ 2412-2561 called 1x
  - a @ 2470-2479 called 0x
  - a @ 2488-2560 called 0x
- 55eb4b32-87960e808445d7a8.js: +47391 bytes (92 functions)
  - BO @ 101-107 called 2x
  - H1 @ 171-176 called 2x
  - HL @ 190-196 called 1x
- (inline): +15606 bytes (16 functions)
  - isRegExp @ 856-1027 called 2x
  - isRegExp @ 988-1025 called 0x
  - isDate @ 1028-1193 called 2x
- 255-4ecccced1aaa83b0.js: +3373 bytes (13 functions)
  - S @ 15769-15861 called 12x
  - S @ 15844-15846 called 11x
  - S @ 15846-15851 called 1x
- (inline): +1899 bytes (2 functions)
  - (anon) @ 0-815 called 1x
  - (anon) @ 0-815 called 1x
  - (anon) @ 271-540 called 0x

### my-library
- (inline): +99542 bytes (105 functions)
  - parseAttributeSelector @ 51302-56495 called 1x
  - parseAttributeSelector @ 56296-56316 called 0x
  - parseAttributeSelector @ 56336-56364 called 0x
- (inline): +15606 bytes (16 functions)
  - isRegExp @ 856-1027 called 8x
  - isRegExp @ 988-1025 called 0x
  - isDate @ 1028-1193 called 8x
- (inline): +1899 bytes (2 functions)
  - (anon) @ 0-815 called 1x
  - (anon) @ 0-815 called 1x
  - (anon) @ 271-540 called 0x
- (inline): +324 bytes (2 functions)
  - (anon) @ 0-162 called 5x
  - (anon) @ 0-162 called 5x
- (inline): +304 bytes (2 functions)
  - (anon) @ 0-152 called 8x
  - (anon) @ 0-152 called 8x
- (inline): +300 bytes (2 functions)
  - (anon) @ 0-150 called 7x
  - (anon) @ 0-150 called 7x
- (inline): +180 bytes (3 functions)
  - (anon) @ 0-75 called 6x
  - (anon) @ 0-75 called 6x
  - (anon) @ 44-74 called 6x
- 4bd1b696-c023c6e3521b1417.js: +120 bytes (19 functions)
  - c @ 573-732 called 100x
  - c @ 629-640 called 8384x
  - c @ 640-708 called 0x
