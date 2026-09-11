# Measured results

Node 26.7.0, macOS arm64, Apple M1 Pro. Same ASTs and shared binding engine.

## Complete experimental module size

| Candidate | Minified bytes | Gzip bytes | Brotli bytes |
| --------- | -------------: | ---------: | -----------: |
| switch    |          6,277 |      2,109 |        1,884 |
| visitor   |          7,355 |      2,350 |        2,105 |

## Warm AST-to-scope-result latency

| Workload | Source bytes before parsing | Switch ms | Visitor ms |
| -------- | --------------------------: | --------: | ---------: |
| small    |                          91 |  0.001417 |   0.001644 |
| medium   |                       6,604 |  0.111643 |   0.125071 |
| large    |                      66,124 |  1.122792 |   1.631537 |

These times exclude source parsing and AST construction. Workloads contain respectively one nested-function example, 40 patterned functions and 400 patterned functions. Large-workload process medians ranged from 1.066 to 1.413 ms for switch and 1.622 to 1.682 ms for visitor. This is a controlled accept-table visitor comparison, not a measurement of the old PR's node-prototype dispatch.

## Estimated retained scope-result heap

| Workload | Switch bytes/result | Visitor bytes/result |
| -------- | ------------------: | -------------------: |
| small    |               1,742 |                1,734 |
| medium   |             105,459 |              104,991 |
| large    |           1,056,001 |            1,049,836 |

Retained memory is effectively the same at this measurement precision. AST inputs already exist at baseline. Whole-process peak RSS on the large timing workload was about 201.5 MiB for switch and 200.4 MiB for visitor; this includes Node/V8 and repeated allocation, not just live scope results. See measurements.json for raw samples.

The visitor adds 241 gzip bytes and 221 Brotli bytes in this slice. Its navigation benefit has no measured speed or memory advantage here. These results do not establish costs for a complete symbol table, compiler or different AST/visitor representation.
