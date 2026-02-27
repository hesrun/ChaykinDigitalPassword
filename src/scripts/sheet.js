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
    const Z_STEP = 10; // backdrop = BASE_Z + idx*Z_STEP, sheet = +1

    // [{ id, sheetEl, backdropEl }]
    const stack = [];

    /* ─── Открыть ─── */
    function open(id) {
        const template = document.querySelector(`[data-sheet-id="${id}"]`);
        if (!template) {
            console.warn(`ActionSheet: шит "${id}" не найден`);
            return;
        }
        if (stack.find((s) => s.id === id)) return;

        const idx = stack.length;

        // Backdrop
        const backdropEl = document.createElement("div");
        backdropEl.className = "as-backdrop";
        backdropEl.style.zIndex = BASE_Z + idx * Z_STEP;
        backdropEl.addEventListener("click", () => close(id));
        document.body.appendChild(backdropEl);

        // Sheet
        const sheetEl = document.createElement("div");
        sheetEl.className = "as-sheet";
        sheetEl.setAttribute("role", "dialog");
        sheetEl.setAttribute("aria-modal", "true");
        sheetEl.style.zIndex = BASE_Z + idx * Z_STEP + 1;

        // Handle
        const handle = document.createElement("div");
        handle.className = "as-handle";
        sheetEl.appendChild(handle);
        sheetEl.appendChild(template.content.cloneNode(true));
        document.body.appendChild(sheetEl);

        stack.push({ id, sheetEl, backdropEl });

        // double rAF — гарантирует что transition сработает
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                backdropEl.classList.add("as-backdrop--visible");
                sheetEl.classList.add("as-sheet--open");
            });
        });

        enableSwipeToClose(sheetEl, handle, id);
    }

    /* ─── Закрыть ─── */
    function close(id) {
        const idx = stack.findIndex((s) => s.id === id);
        if (idx === -1) return;

        const { sheetEl, backdropEl } = stack[idx];
        stack.splice(idx, 1);

        sheetEl.classList.remove("as-sheet--open");
        sheetEl.classList.add("as-sheet--closing");
        backdropEl.classList.remove("as-backdrop--visible");

        const cleanup = () => {
            sheetEl.remove();
            backdropEl.remove();
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

        function canStart(target) {
            // Разрешить свайп только если начало на as-handle
            return target === handleEl;
        }

        function onStart(clientY, target) {
            if (!canStart(target)) return;
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
            (e) => onMove(e.touches[0].clientY),
            { passive: true },
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
        if (opener) open(opener.dataset.sheetOpen);

        const closer = e.target.closest("[data-sheet-close]");
        if (closer) close(closer.dataset.sheetClose);
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && stack.length > 0)
            close(stack[stack.length - 1].id);
    });
})();
