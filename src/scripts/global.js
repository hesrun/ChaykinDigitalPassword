import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";

function initAllTelInputs() {
    const telInputs = document.querySelectorAll('input[type="tel"]');
    telInputs.forEach((input) => {
        if (!input.classList.contains("iti-initialized")) {
            intlTelInput(input, {});
            input.classList.add("iti-initialized");
        }
    });
}

if (typeof window !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAllTelInputs);
    } else {
        initAllTelInputs();
    }
}
