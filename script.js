class Calculator {
    constructor() {
        this.previousOperandElement = document.getElementById('previousOperand');
        this.currentOperandElement = document.getElementById('currentOperand');
        // NEW: Select history and theme toggle elements
        this.historyElement = document.getElementById('historyDisplay');
        this.themeToggle = document.getElementById('themeToggle');
        
        // NEW: Load theme from local storage
        this.loadTheme();
        
        this.clear();
        this.bindEvents();
    }

    // NEW: Load saved theme preference
    loadTheme() {
        const isDarkMode = localStorage.getItem('calculator-dark-mode') === 'true';
        this.themeToggle.checked = isDarkMode;
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    // NEW: Toggle theme and save preference
    toggleTheme() {
        const isDarkMode = this.themeToggle.checked;
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('calculator-dark-mode', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('calculator-dark-mode', 'false');
        }
    }

    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.updateDisplay();
    }
    
    // NEW: Clear history (and display)
    clearHistory() {
        this.historyElement.innerHTML = '';
    }

    delete() {
        this.currentOperand = this.currentOperand.toString().slice(0, -1);
        if (this.currentOperand === '') {
            this.currentOperand = '0';
        }
        this.updateDisplay();
    }

    appendNumber(number) {
        if (number === '.' && this.currentOperand.includes('.')) return;
        
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number;
        } else {
            this.currentOperand = this.currentOperand.toString() + number;
        }
        this.updateDisplay();
    }

    chooseOperation(operation) {
        if (this.currentOperand === '0' && this.previousOperand === '') return;
        
        // Allow changing operation
        if (this.currentOperand === '0' && this.previousOperand !== '') {
            this.operation = operation;
            this.updateDisplay();
            return;
        }

        if (this.previousOperand !== '') {
            this.compute();
        }
        
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '0'; // Set to 0 for display
        this.updateDisplay();
    }

    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        
        if (isNaN(prev) || isNaN(current)) return;

        switch (this.operation) {
            case '+': computation = prev + current; break;
            case '-': computation = prev - current; break;
            case '*': computation = prev * current; break;
            case '/':
                if (current === 0) {
                    alert("Cannot divide by zero!");
                    this.clear();
                    return;
                }
                computation = prev / current;
                break;
            case '%': computation = prev % current; break;
            default: return;
        }

        // NEW: Round long decimals for a cleaner result
        if (computation.toString().includes('.') && computation.toString().split('.')[1].length > 6) {
            computation = parseFloat(computation.toFixed(6));
        }

        // NEW: Add this calculation to the history
        this.addHistory(this.previousOperand, this.currentOperand, this.operation, computation);

        this.currentOperand = computation.toString();
        this.operation = undefined;
        this.previousOperand = '';
        this.updateDisplay();
    }
    
    // NEW: Add an item to the history display
    addHistory(prev, current, op, result) {
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        historyItem.innerHTML = `${this.getDisplayNumber(prev)} ${op} ${this.getDisplayNumber(current)} = <span>${this.getDisplayNumber(result)}</span>`;
        
        // Add to top of list (which is visually the bottom due to flex-direction)
        this.historyElement.appendChild(historyItem);
        
        // Auto-scroll to the bottom
        this.historyElement.scrollTop = this.historyElement.scrollHeight;
    }

    getDisplayNumber(number) {
        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        
        let integerDisplay;
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 });
        }
        
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            // Fix for showing "12." while typing
            if (stringNumber.includes('.') && !decimalDigits) {
                return `${integerDisplay}.`;
            }
            return integerDisplay;
        }
    }

    updateDisplay() {
        this.currentOperandElement.innerText = this.getDisplayNumber(this.currentOperand);
        
        if (this.operation != null) {
            this.previousOperandElement.innerText = 
                `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            this.previousOperandElement.innerText = '';
        }
    }
    
    // NEW: Show visual feedback for keyboard press
    showKeyFeedback(key) {
        // Find the button with the matching 'data-key'
        const button = document.querySelector(`.btn[data-key="${key}"]`);
        if (!button) return;
        
        button.classList.add('active-key');
        setTimeout(() => {
            button.classList.remove('active-key');
        }, 150); // Remove class after 150ms
    }

    bindEvents() {
        // Number buttons
        document.querySelectorAll('.btn-number').forEach(button => {
            button.addEventListener('click', () => {
                this.appendNumber(button.getAttribute('data-number'));
            });
        });

        // Operation buttons
        document.querySelectorAll('.btn-operation').forEach(button => {
            button.addEventListener('click', () => {
                this.chooseOperation(button.getAttribute('data-operation'));
            });
        });

        // Equals button
        document.querySelector('[data-action="equals"]').addEventListener('click', () => {
            this.compute();
        });

        // Clear button
        document.querySelector('[data-action="clear"]').addEventListener('click', () => {
            this.clear();
            // NEW: Add a long-press to clear history
            // (Note: This is a simple version. A true long-press is more complex)
            // For now, let's just have 'C' clear everything.
            this.clearHistory();
        });

        // Delete button
        document.querySelector('[data-action="delete"]').addEventListener('click', () => {
            this.delete();
        });
        
        // NEW: Theme toggle listener
        this.themeToggle.addEventListener('change', () => {
            this.toggleTheme();
        });

        // Keyboard support (refactored)
        document.addEventListener('keydown', (event) => {
            // NEW: Show visual feedback
            this.showKeyFeedback(event.key);
            
            if (event.key >= '0' && event.key <= '9') {
                this.appendNumber(event.key);
            } else if (event.key === '.') {
                this.appendNumber('.');
            } else if (event.key === '+' || event.key === '-' || event.key === '*' || event.key === '/' || event.key === '%') {
                this.chooseOperation(event.key);
            } else if (event.key === 'Enter' || event.key === '=') {
                event.preventDefault();
                this.compute();
            } else if (event.key === 'Escape') {
                this.clear();
                this.clearHistory();
            } else if (event.key === 'Backspace') {
                this.delete();
            }
        });
    }
}

const calculator = new Calculator();