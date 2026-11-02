# FIDO v1.8 — порт для современных систем (macOS, Linux).
#
# Исходники хранятся в UTF-8, но игра внутри работает с текстом в CP866,
# как оригинал (от этого зависит раскладка окон). Поэтому перед компиляцией
# файлы перекодируются в CP866 в каталог build/.

CXX      ?= c++
CXXFLAGS ?= -O2 -g
override CXXFLAGS += -std=c++17 -fsigned-char -Wall -Wno-unknown-warning-option \
            -Wno-invalid-source-encoding -Wno-writable-strings -Wno-write-strings \
            -Wno-parentheses -Wno-dangling-else -Wno-unused-variable \
            -Wno-unused-but-set-variable -Wno-unused-label -Wno-char-subscripts \
            -Wno-misleading-indentation -Wno-format-truncation -Wno-sign-compare \
            -Wno-invalid-utf8 -Wno-c++11-narrowing -Wno-narrowing \
            -Wno-unused-function -Wno-format-overflow -Wno-unused-value \
            -Wno-sometimes-uninitialized -Wno-maybe-uninitialized -Wno-uninitialized \
            -Wno-deprecated-declarations -Wno-missing-braces -Wno-constant-conversion \
            -Wno-empty-body -Wno-unsequenced
ICONV    ?= iconv

GAME_SRC = src/fido.cpp src/wnds.cpp src/date.cpp src/compat.h
BUILD    = build

all: fido

$(BUILD)/%: src/%
	@mkdir -p $(BUILD)
	$(ICONV) -f UTF-8 -t CP866 $< > $@

$(BUILD)/fido.o: $(addprefix $(BUILD)/,fido.cpp wnds.cpp date.cpp compat.h)
	$(CXX) $(CXXFLAGS) -c $(BUILD)/fido.cpp -o $@

$(BUILD)/term.o: src/term.cpp src/compat.h
	@mkdir -p $(BUILD)
	$(CXX) $(CXXFLAGS) -Isrc -c src/term.cpp -o $@

fido: $(BUILD)/fido.o $(BUILD)/term.o
	$(CXX) $(CXXFLAGS) $^ -o $@

run: fido
	./fido

clean:
	rm -rf $(BUILD) fido fido.dSYM

.PHONY: all run clean
