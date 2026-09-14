/* CPython 3.14.3 source-string lexer port experiment, PSF license.
 * Translated from the accompanying CPython-shaped TypeScript experiment and
 * Parser/lexer/lexer.c. No Python runtime. Bulk JSON ABI; research only.
 */
#include "operators.h"
#include "unicode_tables.h"
#include <stdarg.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#define EOI (-1)
typedef struct {
    int literal, curly, expr, quote, size, raw, start, lineStart, firstLine, format, debug, t;
} Mode;
typedef struct {
    int c, line, col;
} Paren;
static unsigned char *bytes;
static int encodingErrorLineByte;
static const char *encodingErrorMessage;
static int length, originalLength, extra, cur, inp, buf, start, lineStart, multiStart, lineno, firstLine, col,
    startCol, done, implicit, atbol, pendin, depth, contLine, commentNewline, npar, nmode, lastLineno, lastA, lastB,
    failed, ntokens;
static int ind[100], altind[100];
static Paren parens[200];
static Mode modes[150];
typedef struct {
    int a, b;
} Line;
static Line *lines;
static int nlines, linecap, positionBase, positionByte, positionCol;
/* Binary records contain WASM linear-memory addresses, valid until reset. */
static int32_t *records;
static int recordcap, binaryMode;
static char *output;
static size_t olen, ocap;
static void reserve(size_t n) {
    if (olen + n + 1 > ocap) {
        ocap = (olen + n + 1) * 2;
        output = realloc(output, ocap);
        if (!output)
            abort();
    }
}
static void putn(const char *s, size_t n) {
    reserve(n);
    memcpy(output + olen, s, n);
    olen += n;
    output[olen] = 0;
}
static void putsj(const char *s) { putn(s, strlen(s)); }
/* The measured WASM build pulled general libc formatting into this lexer.
 * These bounded helpers cover only its fixed diagnostic/JSON formats; unknown
 * conversions abort so new formats cannot silently produce wrong messages.
 * Like snprintf, truncation returns the full length and terminates the buffer.
 */
static void diag_char(char *out, size_t cap, size_t *used, char c) {
    if (*used + 1 < cap)
        out[*used] = c;
    (*used)++;
}
static int diag_vsnprintf(char *out, size_t cap, const char *format, va_list args) {
    size_t used = 0;
    for (const char *p = format; *p; p++) {
        if (*p != '%') {
            diag_char(out, cap, &used, *p);
            continue;
        }
        p++;
        int width = 0;
        if (*p == '0') {
            p++;
            if (*p != '2' && *p != '4')
                abort();
            width = *p++ - '0';
        }
        if (*p == 's' && !width) {
            const char *value = va_arg(args, const char *);
            while (*value)
                diag_char(out, cap, &used, *value++);
        } else if (*p == 'c' && !width) {
            diag_char(out, cap, &used, (char)va_arg(args, int));
        } else if (*p == 'd' || *p == 'x' || *p == 'X') {
            unsigned value;
            if (*p == 'd') {
                int signed_value = va_arg(args, int);
                if (signed_value < 0) {
                    diag_char(out, cap, &used, '-');
                    value = 0u - (unsigned)signed_value;
                } else {
                    value = (unsigned)signed_value;
                }
            } else {
                value = va_arg(args, unsigned);
            }
            unsigned base = *p == 'd' ? 10 : 16;
            const char *digits = *p == 'X' ? "0123456789ABCDEF" : "0123456789abcdef";
            char reversed[16];
            int n = 0;
            do {
                reversed[n++] = digits[value % base];
                value /= base;
            } while (value);
            while (width-- > n)
                diag_char(out, cap, &used, '0');
            while (n)
                diag_char(out, cap, &used, reversed[--n]);
        } else {
            abort();
        }
    }
    if (cap)
        out[used < cap ? used : cap - 1] = 0;
    return (int)used;
}
static int diag_snprintf(char *out, size_t cap, const char *format, ...) {
    va_list args;
    va_start(args, format);
    int n = diag_vsnprintf(out, cap, format, args);
    va_end(args);
    return n;
}
static void fmt(const char *f, ...) {
    char tmp[2048];
    va_list a;
    va_start(a, f);
    int n = diag_vsnprintf(tmp, sizeof(tmp), f, a);
    va_end(a);
    if (n < 0 || n >= (int)sizeof(tmp))
        abort();
    putn(tmp, n);
}
static void quote(const unsigned char *s, int n) {
    putsj("\"");
    for (int i = 0; i < n; i++) {
        int c = s[i];
        if (c == '"' || c == '\\') {
            char q[2] = {'\\', c};
            putn(q, 2);
        } else if (c < 32)
            fmt("\\u%04x", c);
        else
            putn((const char *)s + i, 1);
    }
    putsj("\"");
}
static void qstr(const char *s) { quote((const unsigned char *)s, strlen(s)); }
static int count(int a, int b) {
    int n = 0;
    for (int j = a < 0 ? 0 : a; j < b; j++)
        if ((bytes[j] & 192) != 128)
            n++;
    return n;
}
static int column(int base, int end) {
    if (positionBase != base || end < positionByte) {
        positionBase = base;
        positionByte = base;
        positionCol = 0;
    }
    positionCol += count(positionByte, end);
    positionByte = end;
    return positionCol;
}
static int lineid(int a, int b) {
    if (nlines && lines[nlines - 1].a == a && lines[nlines - 1].b == b)
        return nlines - 1;
    if (nlines == linecap) {
        linecap = linecap ? linecap * 2 : 64;
        lines = realloc(lines, linecap * sizeof(*lines));
        if (!lines)
            abort();
    }
    lines[nlines] = (Line){a, b};
    return nlines++;
}
static void error_record(const char *name, const char *msg, int ln, int off, int eln, int eoff, int a, int b) {
    if (failed)
        return;
    failed = 1;
    olen = 0;
    putsj("{\"error\":{\"name\":");
    qstr(name);
    putsj(",\"message\":");
    qstr(msg);
    fmt(",\"lineno\":%d,\"offset\":%d,\"end_lineno\":", ln, off);
    if (eln < 0)
        putsj("null");
    else
        fmt("%d", eln);
    putsj(",\"end_offset\":");
    if (eoff < 0)
        putsj("null");
    else
        fmt("%d", eoff);
    putsj(",\"text\":");
    if (a < 0)
        putsj("null");
    else
        quote(bytes + a, b - a);
    putsj("}}");
}
static void syntax_at(const char *msg, int off, int end) {
    int eol = lineStart;
    while (eol < length && bytes[eol] != 10 && bytes[eol] != 0)
        eol++;
    if (off < 0)
        off = count(lineStart, cur);
    if (end < 0)
        end = off;
    error_record("SyntaxError", msg, lineno, off, lineno, end, lineStart, eol);
}
static void syntax(const char *msg) { syntax_at(msg, -1, -1); }
#define FAIL(msg)                                                                                                     \
    do {                                                                                                              \
        syntax(msg);                                                                                                  \
        return NULL;                                                                                                  \
    } while (0)
static void err(int code) {
    const char *msgs[] = {"unexpected EOF in multi-line statement",
                          "unindent does not match any outer indentation level",
                          "inconsistent use of tabs and spaces in indentation", "too many levels of indentation",
                          "unexpected character after line continuation character"};
    error_record(code == 2                ? "TabError"
                 : code == 1 || code == 3 ? "IndentationError"
                                          : "SyntaxError",
                 msgs[code], lineno, code == 0 ? inp - buf : count(buf, inp), code == 0 ? lineno : -1, -1,
                 code == 0 ? -1 : buf, inp - 1);
}
/* Mirrors TextDecoder fatal errors for token slices that end inside UTF-8. */
static int strictText(int a, int b) {
    if (a < 0 || b < 0)
        return 1;
    int i = 0, end = 0, nbytes = b - a;
    const unsigned char *v = bytes + a;
    const char *reason = "invalid start byte";
    for (; i < nbytes; i++) {
        int c = v[i];
        if (c < 128)
            continue;
        int n = c >= 194 && c <= 223 ? 2 : c >= 224 && c <= 239 ? 3 : c >= 240 && c <= 244 ? 4 : 0;
        if (!n) {
            end = i + 1;
            break;
        }
        int j = 1;
        for (; j < n && i + j < nbytes; j++) {
            int x = v[i + j];
            if (x < 128 || x > 191 ||
                (j == 1 &&
                 ((c == 224 && x < 160) || (c == 237 && x >= 160) || (c == 240 && x < 144) || (c == 244 && x >= 144))))
                break;
        }
        if (j < n) {
            end = i + j;
            reason = i + j == nbytes ? "unexpected end of data" : "invalid continuation byte";
            break;
        }
        i += n - 1;
    }
    if (i == nbytes)
        return 1;
    char span[128], msg[256];
    if (end - i > 1)
        diag_snprintf(span, sizeof(span), "bytes in position %d-%d", i, end - 1);
    else
        diag_snprintf(span, sizeof(span), "byte 0x%02x in position %d", v[i], i);
    diag_snprintf(msg, sizeof(msg), "'utf-8' codec can't decode %s: %s", span, reason);
    if (!failed) {
        failed = 1;
        olen = 0;
        putsj("{\"error\":{\"name\":\"UnicodeDecodeError\",\"message\":");
        qstr(msg);
        putsj(",\"lineno\":null,\"offset\":null,\"end_lineno\":null,\"end_offset\":null,\"text\":null}}");
    }
    return 0;
}
static int next(void) {
    if (failed)
        return EOI;
    if (cur != inp) {
        col++;
        return bytes[cur++];
    }
    if (done)
        return EOI;
    if (start < 0 && nmode == 1)
        buf = cur;
    lineStart = cur;
    if (cur == encodingErrorLineByte) {
        failed = 1;
        olen = 0;
        putsj("{\"error\":{\"name\":\"UnicodeEncodeError\",\"message\":");
        qstr(encodingErrorMessage);
        putsj(",\"lineno\":null,\"offset\":null,\"end_lineno\":null,\"end_offset\":null,\"text\":null}}");
        return EOI;
    }
    if (cur >= length) {
        done = 1;
        return EOI;
    }
    int end = cur;
    while (end < length && bytes[end] != 10)
        end++;
    inp = end < length ? end + 1 : end;
    implicit = inp > originalLength;
    lineno++;
    col = 0;
    for (int j = cur; j < inp; j++)
        if (!bytes[j]) {
            syntax("source code cannot contain null bytes");
            return EOI;
        }
    col++;
    return bytes[cur++];
}
static void back(int c) {
    if (c != EOI) {
        cur--;
        col--;
    }
}
static int digit(int c) { return c >= 48 && c <= 57; }
static int hex(int c) { return digit(c) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102); }
static int potentialStart(int c) { return c == 95 || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c >= 128; }
static int potentialChar(int c) { return potentialStart(c) || digit(c); }
static int inRanges(unsigned cp, const unsigned *r, int n) {
    int lo = 0, hi = n / 2 - 1;
    while (lo <= hi) {
        int m = (lo + hi) / 2;
        if (cp < r[m * 2])
            hi = m - 1;
        else if (cp > r[m * 2 + 1])
            lo = m + 1;
        else
            return 1;
    }
    return 0;
}
#define INR(cp, key) inRanges(cp, unicode_##key, sizeof(unicode_##key) / sizeof(unsigned))
static const char *opname(const char *s) {
    for (unsigned i = 0; i < sizeof(operators) / sizeof(*operators); i++)
        if (!strcmp(s, operators[i].text))
            return operators[i].name;
    return NULL;
}
static int isop(const char *s) {
    for (unsigned i = 0; i < sizeof(operators) / sizeof(*operators); i++)
        if (!strcmp(s, operators[i].name))
            return 1;
    return 0;
}
static const char *make(const char *type, int a, int b) {
    if (failed || !strictText(a, b))
        return NULL;
    int stringlit = !strcmp(type, "STRING") || !strcmp(type, "FSTRING_MIDDLE") || !strcmp(type, "TSTRING_MIDDLE");
    int ls = stringlit ? multiStart : lineStart;
    int trailing = !strcmp(type, "ENDMARKER") || (!strcmp(type, "DEDENT") && done);
    int la = lastA, lb = lastB;
    if (extra && trailing)
        la = lb = 0;
    else if (lineno != lastLineno) {
        la = ls;
        lb = inp - implicit;
        lastA = la;
        lastB = lb;
    }
    int ln = stringlit ? firstLine : lineno, eln = lineno, cl = a >= ls ? column(ls, a) : -1,
        ec = b >= lineStart ? column(lineStart, b) : -1;
    lastLineno = ln;
    const char *override = NULL;
    int overrideLen = 0;
    if (extra) {
        if (trailing) {
            ln++;
            eln = ln;
            cl = ec = 0;
        }
        if (isop(type))
            type = "OP";
        else if (!strcmp(type, "NEWLINE")) {
            if (!implicit) {
                override = bytes[start] == 13 ? "\r\n" : "\n";
                overrideLen = strlen(override);
            }
            ec++;
        } else if (!strcmp(type, "NL") && implicit) {
            override = "";
        }
    }
    if (binaryMode) {
        if (ntokens == recordcap) {
            recordcap = recordcap ? recordcap * 2 : 128;
            records = realloc(records, (size_t)recordcap * 10 * sizeof(*records));
            if (!records)
                abort();
        }
        int32_t *r = records + ntokens++ * 10;
        const unsigned char *text = override         ? (const unsigned char *) override
                                    : a < 0 || b < 0 ? (const unsigned char *)""
                                                     : bytes + a;
        int textlen = override ? overrideLen : a < 0 || b < 0 ? 0 : b - a;
        r[0] = (int32_t)(uintptr_t)type;
        r[1] = (int32_t)strlen(type);
        r[2] = (int32_t)(uintptr_t)text;
        r[3] = textlen;
        r[4] = ln;
        r[5] = cl;
        r[6] = eln;
        r[7] = ec;
        r[8] = (int32_t)(uintptr_t)(bytes + la);
        r[9] = lb - la;
        return type;
    }
    if (ntokens++)
        putsj(",");
    putsj("{\"type\":");
    qstr(type);
    putsj(",\"string\":");
    if (override)
        quote((const unsigned char *) override, overrideLen);
    else if (a < 0 || b < 0)
        qstr("");
    else
        quote(bytes + a, b - a);
    fmt(",\"start\":[%d,%d],\"end\":[%d,%d],\"line\":", ln, cl, eln, ec);
    fmt("%d", lineid(la, lb));
    putsj("}");
    return type;
}
static int continuation(void) {
    int c = next();
    if (c == 13)
        c = next();
    if (c != 10) {
        err(4);
        return EOI;
    }
    c = next();
    if (c == EOI) {
        err(0);
        return EOI;
    }
    back(c);
    return c;
}
static void verifyEnd(int c, const char *kind) {
    if (extra || failed)
        return;
    const char *s = c == 97 ? "nd" : c == 101 ? "lse" : c == 102 ? "or" : c == 111 ? "r" : c == 110 ? "ot" : NULL;
    if (c == 105 && cur < length && (bytes[cur] == 102 || bytes[cur] == 110 || bytes[cur] == 115))
        return;
    if (s) {
        int j = 0;
        while (s[j] && cur + j < length && bytes[cur + j] == s[j])
            j++;
        if (!s[j] && !potentialChar(cur + j < length ? bytes[cur + j] : EOI))
            return;
    }
    if (c < 128 && potentialChar(c)) {
        char msg[128];
        back(c);
        diag_snprintf(msg, sizeof(msg), "invalid %s literal", kind);
        syntax(msg);
    }
}
static int decimalTail(void) {
    int c;
    do {
        do {
            c = next();
        } while (digit(c));
        if (c != 95)
            break;
        c = next();
        if (!digit(c)) {
            back(c);
            syntax("invalid decimal literal");
            return EOI;
        }
    } while (!failed);
    return c;
}
static void verifyIdentifier(void) {
    if (extra)
        return;
    int p = start, first = 1;
    while (p < cur && !failed) {
        int begin = p;
        unsigned cp = bytes[p++];
        if (cp >= 128) {
            int n = cp < 224 ? 1 : cp < 240 ? 2 : 3;
            cp &= (1 << (6 - n)) - 1;
            while (n-- && p < cur)
                cp = (cp << 6) | (bytes[p++] & 63);
        }
        int ok =
            cp < 128 ? (first ? potentialStart(cp) : potentialChar(cp)) : (first ? INR(cp, start) : INR(cp, continue));
        first = 0;
        if (!ok) {
            char msg[160], ch[5] = {0};
            memcpy(ch, bytes + begin, p - begin);
            cur = p;
            if (!INR(cp, printable))
                diag_snprintf(msg, sizeof(msg), "invalid non-printable character U+%04X", cp);
            else
                diag_snprintf(msg, sizeof(msg), "invalid character '%s' (U+%04X)", ch, cp);
            syntax(msg);
        }
    }
}
static int validbase(int c, int base) {
    return base == 16 ? hex(c) : base == 8 ? c >= 48 && c < 56 : c == 48 || c == 49;
}
static const char *number(int c, int dot) {
    const char *kind = "decimal";
    int fraction = dot, exponent = 0, imaginary = 0;
    if (dot) {
    } else if (c == 48) {
        c = next();
        int base = c == 120 || c == 88 ? 16 : c == 111 || c == 79 ? 8 : c == 98 || c == 66 ? 2 : 0;
        if (base) {
            kind = base == 16 ? "hexadecimal" : base == 8 ? "octal" : "binary";
            c = next();
            do {
                if (c == 95)
                    c = next();
                if (!validbase(c, base)) {
                    char msg[128];
                    if (base != 16 && digit(c))
                        diag_snprintf(msg, sizeof(msg), "invalid digit '%c' in %s literal", c, kind);
                    else {
                        back(c);
                        diag_snprintf(msg, sizeof(msg), "invalid %s literal", kind);
                    }
                    FAIL(msg);
                }
                do {
                    c = next();
                } while (validbase(c, base));
            } while (c == 95);
            if (base != 16 && digit(c)) {
                char msg[128];
                diag_snprintf(msg, sizeof(msg), "invalid digit '%c' in %s literal", c, kind);
                FAIL(msg);
            }
            verifyEnd(c, kind);
            back(c);
            return make("NUMBER", start, cur);
        }
        int nonzero = 0;
        while (1) {
            if (c == 95) {
                c = next();
                if (!digit(c)) {
                    back(c);
                    FAIL("invalid decimal literal");
                }
            }
            if (c != 48)
                break;
            c = next();
        }
        int zerosEnd = cur;
        if (digit(c)) {
            nonzero = 1;
            c = decimalTail();
        }
        if (c == 46) {
            c = next();
            fraction = 1;
        } else if (c == 101 || c == 69)
            exponent = 1;
        else if (c == 106 || c == 74)
            imaginary = 1;
        else if (nonzero && !extra) {
            back(c);
            syntax_at(
                "leading zeros in decimal integer literals are not permitted; use an 0o prefix for octal integers",
                start + 1 - lineStart, zerosEnd - lineStart);
            return NULL;
        } else {
            verifyEnd(c, "decimal");
            back(c);
            return make("NUMBER", start, cur);
        }
    } else {
        c = decimalTail();
        if (c == 46) {
            c = next();
            fraction = 1;
        }
    }
    if (fraction && digit(c))
        c = decimalTail();
    if (exponent || c == 101 || c == 69) {
        int e = c;
        c = next();
        if (c == 43 || c == 45) {
            c = next();
            if (!digit(c)) {
                back(c);
                FAIL("invalid decimal literal");
            }
        } else if (!digit(c)) {
            back(c);
            verifyEnd(e, "decimal");
            back(e);
            return make("NUMBER", start, cur);
        }
        c = decimalTail();
    }
    if (imaginary || c == 106 || c == 74) {
        c = next();
        kind = "imaginary";
    }
    verifyEnd(c, kind);
    back(c);
    return make("NUMBER", start, cur);
}
static const char *normal(void);
static const char *string(int quote) {
    int size = 1, endSize = 0, escaped = 0, c;
    firstLine = lineno;
    multiStart = lineStart;
    c = next();
    if (c == quote) {
        c = next();
        if (c == quote)
            size = 3;
        else
            endSize = 1;
    }
    if (c != quote)
        back(c);
    while (endSize != size && !failed) {
        c = next();
        if (c == EOI || (size == 1 && c == 10)) {
            int detected = lineno;
            cur = start + 1;
            lineStart = multiStart;
            lineno = firstLine;
            char msg[256];
            Mode *m = &modes[nmode - 1];
            if (nmode > 1 && m->quote == quote && m->size == size)
                diag_snprintf(msg, sizeof(msg), "%c-string: expecting '}'", m->t ? 't' : 'f');
            else
                diag_snprintf(msg, sizeof(msg), "unterminated %sstring literal (detected at line %d)%s",
                              size == 3 ? "triple-quoted " : "", detected,
                              size == 1 && escaped ? "; perhaps you escaped the end quote?" : "");
            FAIL(msg);
        }
        if (c == quote)
            endSize++;
        else {
            endSize = 0;
            if (c == 92) {
                c = next();
                if (c == quote)
                    escaped = 1;
                if (c == 13)
                    c = next();
            }
        }
    }
    return make("STRING", start, cur);
}
static const char *startInterpolated(int quote, int saw) {
    int size = 1;
    firstLine = lineno;
    multiStart = lineStart;
    int after = next();
    if (after == quote) {
        int after2 = next();
        if (after2 == quote)
            size = 3;
        else {
            back(after2);
            back(after);
        }
    }
    if (after != quote)
        back(after);
    if (nmode >= 150)
        FAIL("too many nested f-strings or t-strings");
    Mode *m = &modes[nmode++];
    memset(m, 0, sizeof(*m));
    m->literal = 1;
    m->quote = quote;
    m->size = size;
    m->start = start;
    m->lineStart = lineStart;
    m->firstLine = lineno;
    m->raw = !!(saw & 2);
    m->t = !!(saw & 8);
    m->expr = -1;
    return make(m->t ? "TSTRING_START" : "FSTRING_START", start, cur);
}
static const char *normal(void) {
    Mode *m = &modes[nmode - 1];
nextline:
    while (!failed) {
        start = -1;
        startCol = -1;
        int blankline = 0, c;
        if (atbol) {
            int cl = 0, alt = 0, cont = 0;
            atbol = 0;
            while (1) {
                c = next();
                if (c == 32) {
                    cl++;
                    alt++;
                } else if (c == 9) {
                    cl = (cl / 8 + 1) * 8;
                    alt++;
                } else if (c == 12) {
                    cl = alt = 0;
                } else if (c == 92) {
                    cont = cont ? cont : cl;
                    continuation();
                    if (failed)
                        return NULL;
                } else
                    break;
            }
            back(c);
            if (c == 35 || c == 10 || c == 13)
                blankline = 1;
            if (!blankline && !npar) {
                cl = cont ? cont : cl;
                alt = cont ? cont : alt;
                if (cl == ind[depth]) {
                    if (alt != altind[depth])
                        err(2);
                } else if (cl > ind[depth]) {
                    if (depth + 1 >= 100) {
                        err(3);
                        return NULL;
                    }
                    if (alt <= altind[depth])
                        err(2);
                    pendin++;
                    depth++;
                    ind[depth] = cl;
                    altind[depth] = alt;
                } else {
                    while (depth > 0 && cl < ind[depth]) {
                        pendin--;
                        depth--;
                    }
                    if (cl != ind[depth])
                        err(1);
                    if (alt != altind[depth])
                        err(2);
                }
            }
        }
        if (failed)
            return NULL;
        start = cur;
        startCol = col;
        if (pendin) {
            if (pendin < 0) {
                pendin++;
                return make("DEDENT", extra ? cur : -1, extra ? cur : -1);
            }
            pendin--;
            return make("INDENT", extra ? buf : -1, extra ? cur : -1);
        }
        c = next();
        back(c);
        while (!failed) {
            start = -1;
            do {
                c = next();
            } while (c == 32 || c == 9 || c == 12);
            start = cur - 1;
            startCol = col - 1;
            if (c == 35) {
                while (c != EOI && c != 10 && c != 13)
                    c = next();
                if (extra) {
                    back(c);
                    commentNewline = blankline;
                    return make("COMMENT", start, cur);
                }
            }
            if (c == EOI) {
                if (npar)
                    err(0);
                return make("ENDMARKER", -1, -1);
            }
            if (potentialStart(c)) {
                int saw = 0, nonascii = 0;
                while (1) {
                    int lower = c >= 65 && c <= 90 ? c + 32 : c;
                    int bit = lower == 98    ? 1
                              : lower == 114 ? 2
                              : lower == 117 ? 4
                              : lower == 116 ? 8
                              : lower == 102 ? 16
                                             : 0;
                    if (bit && !(saw & bit))
                        saw |= bit;
                    else
                        break;
                    c = next();
                    if (c == 34 || c == 39) {
                        const int pa[] = {4, 4, 4, 4, 1, 1, 16}, pb[] = {1, 2, 16, 8, 16, 8, 8};
                        const char ca[] = "uuuubbf", cb[] = "brftftt";
                        for (int j = 0; j < 7; j++)
                            if ((saw & pa[j]) && (saw & pb[j])) {
                                char msg[128];
                                diag_snprintf(msg, sizeof(msg), "'%c' and '%c' prefixes are incompatible", ca[j],
                                              cb[j]);
                                syntax_at(msg, start + 1 - lineStart, cur - lineStart);
                                return NULL;
                            }
                        return saw & (16 | 8) ? startInterpolated(c, saw) : string(c);
                    }
                }
                while (potentialChar(c)) {
                    if (c >= 128)
                        nonascii = 1;
                    c = next();
                }
                back(c);
                if (nonascii)
                    verifyIdentifier();
                return make("NAME", start, cur);
            }
            if (c == 13)
                c = next();
            if (c == 10) {
                atbol = 1;
                if (blankline || npar) {
                    if (extra) {
                        commentNewline = 0;
                        return make("NL", start, cur);
                    }
                    goto nextline;
                }
                if (commentNewline && extra) {
                    commentNewline = 0;
                    return make("NL", start, cur);
                }
                contLine = 0;
                return make("NEWLINE", start, cur - 1);
            }
            if (c == 46) {
                c = next();
                if (digit(c))
                    return number(c, 1);
                if (c == 46) {
                    c = next();
                    if (c == 46)
                        return make("ELLIPSIS", start, cur);
                    back(c);
                    back(46);
                } else
                    back(c);
                return make("DOT", start, cur);
            }
            if (digit(c))
                return number(c, 0);
            if (c == 34 || c == 39)
                return string(c);
            if (c == 92) {
                continuation();
                contLine = 1;
                continue;
            }
            if ((c == 58 || c == 125 || c == 33 || c == 123) && nmode > 1 && m->expr >= 0) {
                int cursor = m->curly - (c != 123);
                if (c == 58 && cursor == m->expr) {
                    m->literal = 1;
                    m->format = 1;
                    return make("COLON", start, cur);
                }
            }
            int c2 = next();
            char pair[4] = {(char)c, (char)c2, 0, 0};
            const char *op = opname(pair);
            if (op) {
                int c3 = next();
                pair[2] = (char)c3;
                const char *triple = opname(pair);
                if (triple)
                    op = triple;
                else
                    back(c3);
                return make(op, start, cur);
            }
            back(c2);
            if (c == 40 || c == 91 || c == 123) {
                if (npar >= 200)
                    FAIL("too many nested parentheses");
                parens[npar++] = (Paren){c, lineno, start - lineStart};
                if (nmode > 1)
                    m->curly++;
            } else if (c == 41 || c == 93 || c == 125) {
                char prefix = m->t ? 't' : 'f', msg[256];
                if (nmode > 1 && !m->curly && c == 125) {
                    diag_snprintf(msg, sizeof(msg), "%c-string: single '}' is not allowed", prefix);
                    FAIL(msg);
                }
                if (!extra && !npar) {
                    diag_snprintf(msg, sizeof(msg), "unmatched '%c'", c);
                    FAIL(msg);
                }
                if (npar) {
                    Paren opening = parens[--npar];
                    if (!extra && !((opening.c == 40 && c == 41) || (opening.c == 91 && c == 93) ||
                                    (opening.c == 123 && c == 125))) {
                        if (nmode > 1 && opening.c == 123 && m->curly - 1 == m->expr) {
                            diag_snprintf(msg, sizeof(msg), "%c-string: unmatched '%c'", prefix, c);
                            FAIL(msg);
                        }
                        if (opening.line != lineno)
                            diag_snprintf(
                                msg, sizeof(msg),
                                "closing parenthesis '%c' does not match opening parenthesis '%c' on line %d", c,
                                opening.c, opening.line);
                        else
                            diag_snprintf(msg, sizeof(msg),
                                          "closing parenthesis '%c' does not match opening parenthesis '%c'", c,
                                          opening.c);
                        FAIL(msg);
                    }
                }
                if (nmode > 1) {
                    m->curly--;
                    if (m->curly < 0) {
                        diag_snprintf(msg, sizeof(msg), "%c-string: unmatched '%c'", prefix, c);
                        FAIL(msg);
                    }
                    if (c == 125 && m->curly == m->expr) {
                        m->expr--;
                        m->literal = 1;
                        m->format = 0;
                        m->debug = 0;
                    }
                }
            }
            if (c < 32 || c == 127) {
                char msg[128];
                diag_snprintf(msg, sizeof(msg), "invalid non-printable character U+%04X", c);
                FAIL(msg);
            }
            if (c == 61 && m->curly - m->expr == 1)
                m->debug = 1;
            char single[2] = {(char)c, 0};
            op = opname(single);
            return make(op ? op : "OP", start, cur);
        }
    }
    return NULL;
}
static const char *literal(void) {
    Mode *m = &modes[nmode - 1];
    int endSize = 0, unicodeEscape = 0;
    start = cur;
    firstLine = lineno;
    startCol = col;
    int startChar = next();
    if (startChar == 123) {
        int p = next();
        back(p);
        back(startChar);
        if (p != 123) {
            m->expr++;
            if (m->expr >= 3) {
                char msg[128];
                diag_snprintf(msg, sizeof(msg), "%c-string: expressions nested too deeply", m->t ? 't' : 'f');
                FAIL(msg);
            }
            m->literal = 0;
            return normal();
        }
    } else
        back(startChar);
    int finished = 1;
    for (int j = 0; j < m->size; j++) {
        int q = next();
        if (q != m->quote) {
            back(q);
            finished = 0;
            break;
        }
    }
    if (finished) {
        nmode--;
        return make(m->t ? "TSTRING_END" : "FSTRING_END", start, cur);
    }
    multiStart = lineStart;
    while (endSize != m->size && !failed) {
        int c = next(), format = m->format && m->expr >= 0;
        char prefix = m->t ? 't' : 'f';
        if (c == EOI || (m->size == 1 && c == 10)) {
            char msg[256];
            if (format && c == 10) {
                if (m->size == 1) {
                    diag_snprintf(
                        msg, sizeof(msg),
                        "%c-string: newlines are not allowed in format specifiers for single quoted %c-strings",
                        prefix, prefix);
                    FAIL(msg);
                }
                back(c);
                m->literal = 0;
                m->format = 0;
                return make(m->t ? "TSTRING_MIDDLE" : "FSTRING_MIDDLE", start, cur);
            }
            int detected = lineno;
            cur = m->start + 1;
            lineStart = m->lineStart;
            lineno = m->firstLine;
            diag_snprintf(msg, sizeof(msg), "unterminated %s%c-string literal (detected at line %d)",
                          m->size == 3 ? "triple-quoted " : "", prefix, detected);
            FAIL(msg);
        }
        if (c == m->quote) {
            endSize++;
            continue;
        } else
            endSize = 0;
        if (c == 123) {
            int p = next();
            if (p != 123 || format) {
                back(p);
                back(c);
                m->expr++;
                if (m->expr >= 3) {
                    char msg[128];
                    diag_snprintf(msg, sizeof(msg), "%c-string: expressions nested too deeply", prefix);
                    FAIL(msg);
                }
                m->literal = 0;
                m->format = 0;
                return make(m->t ? "TSTRING_MIDDLE" : "FSTRING_MIDDLE", start, cur);
            }
            return make(m->t ? "TSTRING_MIDDLE" : "FSTRING_MIDDLE", start, cur - 1);
        }
        if (c == 125) {
            if (unicodeEscape)
                return make(m->t ? "TSTRING_MIDDLE" : "FSTRING_MIDDLE", start, cur);
            int p = next();
            if (p == 125 && !format && m->curly == 0)
                return make(m->t ? "TSTRING_MIDDLE" : "FSTRING_MIDDLE", start, cur - 1);
            back(p);
            back(c);
            m->literal = 0;
            m->format = 0;
            return make(m->t ? "TSTRING_MIDDLE" : "FSTRING_MIDDLE", start, cur);
        }
        if (c == 92) {
            int p = next();
            if (p == 13)
                p = next();
            if (p == 123 || p == 125) {
                back(p);
                continue;
            }
            if (!m->raw && p == 78) {
                p = next();
                if (p == 123)
                    unicodeEscape = 1;
                else
                    back(p);
            }
        }
    }
    for (int j = 0; j < m->size; j++)
        back(m->quote);
    return make(m->t ? "TSTRING_MIDDLE" : "FSTRING_MIDDLE", start, cur);
}
void lex_reset(void) {
    free(bytes);
    bytes = NULL;
    free(output);
    output = NULL;
    olen = ocap = 0;
    free(lines);
    lines = NULL;
    nlines = linecap = 0;
    free(records);
    records = NULL;
    recordcap = 0;
    ntokens = 0;
    binaryMode = 0;
    failed = 0;
}
const char *lex_result_ptr(void) { return binaryMode && !failed ? (const char *)records : output; }
int lex_result_len(void) { return binaryMode && !failed ? ntokens * 40 : (int)olen; }
static int run(const unsigned char *source, int n, int extraTokens, int encodingLine, const char *encodingMessage,
               int binary) {
    lex_reset();
    binaryMode = binary;
    encodingErrorLineByte = encodingLine;
    encodingErrorMessage = encodingMessage;
    originalLength = n;
    length = n + (n > 0 && source[n - 1] != 10);
    bytes = malloc(length + 1);
    if (!bytes)
        abort();
    memcpy(bytes, source, n);
    if (length > n)
        bytes[n] = 10;
    bytes[length] = 0;
    extra = extraTokens;
    cur = inp = buf = lineStart = multiStart = lineno = firstLine = done = implicit = pendin = depth = contLine =
        commentNewline = npar = lastLineno = lastA = lastB = failed = ntokens = 0;
    start = col = startCol = -1;
    positionBase = -1;
    positionByte = positionCol = 0;
    atbol = 1;
    nmode = 1;
    memset(modes, 0, sizeof(modes));
    ind[0] = altind[0] = 0;
    if (!binaryMode)
        putsj("{\"tokens\":[");
    while (!failed) {
        if (!extra && !length)
            break;
        const char *t = modes[nmode - 1].literal ? literal() : normal();
        if (!t || !strcmp(t, "ENDMARKER"))
            break;
    }
    if (!failed && !binaryMode) {
        putsj("],\"lines\":[");
        for (int i = 0; i < nlines; i++) {
            if (i)
                putsj(",");
            quote(bytes + lines[i].a, lines[i].b - lines[i].a);
        }
        putsj("]}");
    }
    return failed;
}

int lex_run(const unsigned char *source, int n, int extraTokens, int encodingLine, const char *encodingMessage) {
    return run(source, n, extraTokens, encodingLine, encodingMessage, 0);
}
int lex_run_binary(const unsigned char *source, int n, int extraTokens, int encodingLine,
                   const char *encodingMessage) {
    return run(source, n, extraTokens, encodingLine, encodingMessage, 1);
}
