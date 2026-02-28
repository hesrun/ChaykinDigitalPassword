// API:
//   ActionSheet.open('id')
//   ActionSheet.close('id')
//   ActionSheet.closeAll()
//
// Декларативно:
//   <button data-sheet-open="id">
//   <button data-sheet-close="id">

(() => {
    const BASE_Z = 200;
    const Z_STEP = 10;

    // [{ id, rootEl, sheetEl, backdropEl }]
    const stack = [];

    /* ─── Открыть ─── */
    function open(id) {
        const rootEl = document.querySelector(`[data-sheet-id="${id}"]`);

        if (!rootEl) {
            console.warn(`ActionSheet: шит "${id}" не найден`);
            return;
        }
        if (stack.find((s) => s.id === id)) return;

        const backdropEl = rootEl.querySelector("[data-sheet-backdrop]");
        const sheetEl = rootEl.querySelector("[data-sheet-panel]");
        const handleEl = rootEl.querySelector("[data-sheet-handle]");

        const idx = stack.length;
        rootEl.style.zIndex = BASE_Z + idx * Z_STEP;

        if (!rootEl.dataset.sheetInitialized) {
            backdropEl.addEventListener("click", () => close(id));
            enableSwipeToClose(sheetEl, handleEl, id);
            rootEl.dataset.sheetInitialized = "1";
        }

        stack.push({ id, rootEl, sheetEl, backdropEl });

        rootEl.classList.add("as-sheet-item--open"); // показываем контейнер

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                backdropEl.classList.add("as-backdrop--visible");
                sheetEl.classList.add("as-sheet--open"); // анимируем шит
            });
        });
    }

    /* ─── Закрыть ─── */
    function close(id) {
        const idx = stack.findIndex((s) => s.id === id);
        if (idx === -1) return;

        const { rootEl, sheetEl, backdropEl } = stack[idx];
        stack.splice(idx, 1);

        sheetEl.classList.remove("as-sheet--open");
        sheetEl.classList.add("as-sheet--closing");
        backdropEl.classList.remove("as-backdrop--visible");

        const cleanup = () => {
            sheetEl.classList.remove("as-sheet--closing");
            rootEl.classList.remove("as-sheet-item--open"); // скрываем контейнер после анимации
        };
        sheetEl.addEventListener("transitionend", cleanup, { once: true });
        setTimeout(cleanup, 450);
    }
    function closeAll() {
        [...stack].reverse().forEach((s) => close(s.id));
    }

    /* ─── Swipe-to-close ─── */
    function enableSwipeToClose(sheetEl, handleEl, id) {
        let startY = 0,
            lastY = 0,
            lastTime = 0;
        let velocity = 0;
        let isDragging = false;

        function onStart(clientY, target) {
            if (target !== handleEl) return;
            isDragging = true;
            startY = lastY = clientY;
            lastTime = Date.now();
            velocity = 0;
            sheetEl.classList.add("as-sheet--dragging");
        }

        function onMove(clientY) {
            if (!isDragging) return;
            const now = Date.now();
            velocity = (clientY - lastY) / Math.max(now - lastTime, 1);
            lastY = clientY;
            lastTime = now;

            const delta = clientY - startY;
            sheetEl.style.setProperty(
                "--drag-y",
                delta < 0 ? `${delta * 0.08}px` : `${delta}px`,
            );
        }

        function onEnd(clientY) {
            if (!isDragging) return;
            isDragging = false;

            const delta = clientY - startY;
            const shouldClose =
                delta > sheetEl.offsetHeight * 0.3 ||
                (delta > 40 && velocity > 0.5);

            sheetEl.style.removeProperty("--drag-y");
            sheetEl.classList.remove("as-sheet--dragging");

            if (shouldClose) close(id);
        }

        // Touch
        sheetEl.addEventListener(
            "touchstart",
            (e) => onStart(e.touches[0].clientY, e.target),
            { passive: true },
        );
        sheetEl.addEventListener(
            "touchmove",
            (e) => {
                if (isDragging) e.preventDefault();
                onMove(e.touches[0].clientY);
            },
            { passive: false },
        );
        sheetEl.addEventListener("touchend", (e) =>
            onEnd(e.changedTouches[0].clientY),
        );
        sheetEl.addEventListener("touchcancel", (e) =>
            onEnd(e.changedTouches[0].clientY),
        );

        // Mouse (dev)
        handleEl.addEventListener("mousedown", (e) => {
            onStart(e.clientY, e.target);
            const onMM = (e) => onMove(e.clientY);
            const onMU = (e) => {
                onEnd(e.clientY);
                window.removeEventListener("mousemove", onMM);
                window.removeEventListener("mouseup", onMU);
            };
            window.addEventListener("mousemove", onMM);
            window.addEventListener("mouseup", onMU);
            e.preventDefault();
        });
    }

    /* ─── Глобальный API ─── */
    window.ActionSheet = { open, close, closeAll };

    /* ─── Декларативные атрибуты ─── */
    document.addEventListener("click", (e) => {
        const opener = e.target.closest("[data-sheet-open]");
        if (opener) {
            e.preventDefault();
            open(opener.dataset.sheetOpen);
        }

        const closer = e.target.closest("[data-sheet-close]");
        if (closer) {
            e.preventDefault();
            close(closer.dataset.sheetClose);
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && stack.length > 0)
            close(stack[stack.length - 1].id);
    });
})();
