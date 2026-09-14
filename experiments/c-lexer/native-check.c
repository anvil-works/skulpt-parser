/* Native sanitizer driver for the WASM experiment's scanner, not a public API. */
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
int lex_run(const unsigned char *, int, int, int, const char *);
void lex_reset(void);
int lex_result_len(void);
int main(void) {
    uint32_t n;
    unsigned long cases = 0, checksum = 0;
    while (fread(&n, sizeof(n), 1, stdin) == 1) {
        unsigned char *source = malloc((size_t)n + 1);
        if (!source || fread(source, 1, n, stdin) != n) return 2;
        source[n] = 0;
        for (int extra = 0; extra <= 1; extra++) {
            lex_run(source, (int)n, extra, -1, NULL);
            checksum += (unsigned)lex_result_len();
            lex_reset();
            cases++;
        }
        free(source);
    }
    printf("{\"calls\":%lu,\"outputByteChecksum\":%lu}\n", cases, checksum);
    return 0;
}
