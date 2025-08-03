document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const tradeForm = document.getElementById('tradeForm');
    const calculateBtn = document.getElementById('calculateBtn');
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    const tradeTableBody = document.getElementById('tradeTableBody');
    const editModal = document.getElementById('editModal');
    const closeBtn = document.querySelector('.close-btn');
    const editTradeForm = document.getElementById('editTradeForm');
    
    // Chart variables
    let profitChart, winRateChart;
    
    // Initialize the app
    init();
    
    function init() {
        // Load trades from localStorage
        loadTrades();
        
        // Calculate and update stats
        updateStats();
        
        // Initialize charts
        initCharts();
        
        // Event listeners
        tradeForm.addEventListener('submit', handleFormSubmit);
        calculateBtn.addEventListener('click', calculateProfitLoss);
        searchInput.addEventListener('input', filterTrades);
        filterSelect.addEventListener('change', filterTrades);
        closeBtn.addEventListener('click', () => editModal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target === editModal) {
                editModal.style.display = 'none';
            }
        });
        
        // Auto-calculate P/L when entry or exit changes
        document.getElementById('entry').addEventListener('change', calculateProfitLoss);
        document.getElementById('exit').addEventListener('change', calculateProfitLoss);
        document.getElementById('size').addEventListener('change', calculateProfitLoss);
        document.getElementById('direction').addEventListener('change', calculateProfitLoss);
        document.getElementById('').addEventListener('change', calculateProfitLoss);
    }
    
    // Handle form submission
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const trade = {
            id: Date.now().toString(),
            date: document.getElementById('date').value,
            symbol: document.getElementById('symbol').value.toUpperCase(),
            direction: document.getElementById('direction').value,
            size: parseFloat(document.getElementById('size').value),
            entry: parseFloat(document.getElementById('entry').value),
            exit: parseFloat(document.getElementById('exit').value),
            stopLoss: document.getElementById('stopLoss').value ? parseFloat(document.getElementById('stopLoss').value) : null,
            takeProfit: document.getElementById('takeProfit').value ? parseFloat(document.getElementById('takeProfit').value) : null,
            fee: parseFloat(document.getElementById('fee').value) || 0,
            result: parseFloat(document.getElementById('result').value),
            notes: document.getElementById('notes').value
        };
        
        saveTrade(trade);
        tradeForm.reset();
        document.getElementById('result').value = '';
    }
    
    // Calculate profit/loss
    function calculateProfitLoss() {
        const direction = document.getElementById('direction').value;
        const size = parseFloat(document.getElementById('size').value) || 0;
        const entry = parseFloat(document.getElementById('entry').value) || 0;
        const exit = parseFloat(document.getElementById('exit').value) || 0;
        const fee = parseFloat(document.getElementById('').value) || 0;
        
        if (size && entry && exit) {
            let result;
            if (direction === 'Long') {
                result = (exit - entry) * size - fee;
            } else {
                result = (entry - exit) * size - fee;
            }
            
            document.getElementById('result').value = result.toFixed(2);
        }
    }
    
    // Save trade to localStorage
    function saveTrade(trade) {
        let trades = JSON.parse(localStorage.getItem('trades')) || [];
        trades.push(trade);
        localStorage.setItem('trades', JSON.stringify(trades));
        
        // Refresh the UI
        loadTrades();
        updateStats();
        updateCharts();
    }
    
    // Load trades from localStorage
    function loadTrades() {
        const trades = JSON.parse(localStorage.getItem('trades')) || [];
        displayTrades(trades);
    }
    
    // Display trades in the table
    function displayTrades(trades) {
        // Sort trades by date (newest first)
        trades.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        tradeTableBody.innerHTML = '';
        
        if (trades.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="8" style="text-align: center;">No trades recorded yet</td>`;
            tradeTableBody.appendChild(row);
            return;
        }
        
        trades.forEach(trade => {
            const row = document.createElement('tr');
            const profitClass = trade.result >= 0 ? 'profit-positive' : 'profit-negative';
            
            row.innerHTML = `
                <td>${formatDate(trade.date)}</td>
                <td>${trade.symbol}</td>
                <td>${trade.direction}</td>
                <td>${trade.size}</td>
                <td>${trade.entry.toFixed(4)}</td>
                <td>${trade.exit.toFixed(4)}</td>
                <td class="${profitClass}">${trade.result >= 0 ? '+' : ''}${trade.result.toFixed(2)}</td>
                <td class="action-buttons">
                    <button class="action-btn edit-btn" data-id="${trade.id}"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${trade.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            
            tradeTableBody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editTrade(btn.dataset.id));
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteTrade(btn.dataset.id));
        });
    }
    
    // Filter trades based on search and filter criteria
    function filterTrades() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value;
        let trades = JSON.parse(localStorage.getItem('trades')) || [];
        
        trades = trades.filter(trade => {
            const matchesSearch = trade.symbol.toLowerCase().includes(searchTerm) || 
                                trade.notes.toLowerCase().includes(searchTerm);
            
            let matchesFilter = true;
            if (filterValue === 'winning') {
                matchesFilter = trade.result >= 0;
            } else if (filterValue === 'losing') {
                matchesFilter = trade.result < 0;
            } else if (filterValue === 'long') {
                matchesFilter = trade.direction === 'Long';
            } else if (filterValue === 'short') {
                matchesFilter = trade.direction === 'Short';
            }
            
            return matchesSearch && matchesFilter;
        });
        
        displayTrades(trades);
    }
    
    // Edit a trade
    function editTrade(tradeId) {
        const trades = JSON.parse(localStorage.getItem('trades')) || [];
        const trade = trades.find(t => t.id === tradeId);
        
        if (!trade) return;
        
        // Populate the edit form
        editTradeForm.innerHTML = `
            <input type="hidden" id="editId" value="${trade.id}">
            <div class="form-row">
                <div class="form-group">
                    <label for="editDate">Date</label>
                    <input type="datetime-local" id="editDate" value="${trade.date}" required>
                </div>
                <div class="form-group">
                    <label for="editSymbol">Symbol</label>
                    <input type="text" id="editSymbol" value="${trade.symbol}" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="editDirection">Direction</label>
                    <select id="editDirection" required>
                        <option value="Long" ${trade.direction === 'Long' ? 'selected' : ''}>Long</option>
                        <option value="Short" ${trade.direction === 'Short' ? 'selected' : ''}>Short</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editSize">Size</label>
                    <input type="number" id="editSize" value="${trade.size}" step="0.01" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="editEntry">Entry Price</label>
                    <input type="number" id="editEntry" value="${trade.entry}" step="0.0001" required>
                </div>
                <div class="form-group">
                    <label for="editExit">Exit Price</label>
                    <input type="number" id="editExit" value="${trade.exit}" step="0.0001" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="editStopLoss">Stop Loss</label>
                    <input type="number" id="editStopLoss" value="${trade.stopLoss || ''}" step="0.0001">
                </div>
                <div class="form-group">
                    <label for="editTakeProfit">Take Profit</label>
                    <input type="number" id="editTakeProfit" value="${trade.takeProfit || ''}" step="0.0001">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="editFee">Fee</label>
                    <input type="number" id="editFee" value="${trade.fee}" step="0.01">
                </div>
                <div class="form-group">
                    <label for="editResult">Result ($)</label>
                    <input type="number" id="editResult" value="${trade.result}" step="0.01">
                </div>
            </div>
            
            <div class="form-group">
                <label for="editNotes">Notes</label>
                <textarea id="editNotes" rows="3">${trade.notes || ''}</textarea>
            </div>
            
            <div class="form-buttons">
                <button type="button" id="updateBtn" class="btn btn-primary">Update Trade</button>
                <button type="button" id="editCalculateBtn" class="btn btn-secondary">Calculate P/L</button>
                <button type="button" class="btn btn-danger" onclick="editModal.style.display='none'">Cancel</button>
            </div>
        `;
        
        // Show the modal
        editModal.style.display = 'block';
        
        // Add event listeners for the edit form
        document.getElementById('editEntry').addEventListener('change', calculateEditProfitLoss);
        document.getElementById('editExit').addEventListener('change', calculateEditProfitLoss);
        document.getElementById('editSize').addEventListener('change', calculateEditProfitLoss);
        document.getElementById('editDirection').addEventListener('change', calculateEditProfitLoss);
        document.getElementById('editFee').addEventListener('change', calculateEditProfitLoss);
        document.getElementById('editCalculateBtn').addEventListener('click', calculateEditProfitLoss);
        document.getElementById('updateBtn').addEventListener('click', updateTrade);
    }
    
    // Calculate P/L for edit form
    function calculateEditProfitLoss() {
        const direction = document.getElementById('editDirection').value;
        const size = parseFloat(document.getElementById('editSize').value) || 0;
        const entry = parseFloat(document.getElementById('editEntry').value) || 0;
        const exit = parseFloat(document.getElementById('editExit').value) || 0;
        const fee = parseFloat(document.getElementById('editFee').value) || 0;
        
        if (size && entry && exit) {
            let result;
            if (direction === 'Long') {
                result = (exit - entry) * size - fee;
            } else {
                result = (entry - exit) * size - fee;
            }
            
            document.getElementById('editResult').value = result.toFixed(2);
        }
    }
    
    // Update a trade
    function updateTrade() {
        const tradeId = document.getElementById('editId').value;
        let trades = JSON.parse(localStorage.getItem('trades')) || [];
        const tradeIndex = trades.findIndex(t => t.id === tradeId);
        
        if (tradeIndex === -1) return;
        
        const updatedTrade = {
            id: tradeId,
            date: document.getElementById('editDate').value,
            symbol: document.getElementById('editSymbol').value.toUpperCase(),
            direction: document.getElementById('editDirection').value,
            size: parseFloat(document.getElementById('editSize').value),
            entry: parseFloat(document.getElementById('editEntry').value),
            exit: parseFloat(document.getElementById('editExit').value),
            stopLoss: document.getElementById('editStopLoss').value ? parseFloat(document.getElementById('editStopLoss').value) : null,
            takeProfit: document.getElementById('editTakeProfit').value ? parseFloat(document.getElementById('editTakeProfit').value) : null,
            fee: parseFloat(document.getElementById('editFee').value) || 0,
            result: parseFloat(document.getElementById('editResult').value),
            notes: document.getElementById('editNotes').value
        };
        
        trades[tradeIndex] = updatedTrade;
        localStorage.setItem('trades', JSON.stringify(trades));
        
        // Refresh the UI
        editModal.style.display = 'none';
        loadTrades();
        updateStats();
        updateCharts();
    }
    
    // Delete a trade
    function deleteTrade(tradeId) {
        if (!confirm('Are you sure you want to delete this trade?')) return;
        
        let trades = JSON.parse(localStorage.getItem('trades')) || [];
        trades = trades.filter(trade => trade.id !== tradeId);
        localStorage.setItem('trades', JSON.stringify(trades));
        
        // Refresh the UI
        loadTrades();
        updateStats();
        updateCharts();
    }
    
    // Update statistics
    function updateStats() {
        const trades = JSON.parse(localStorage.getItem('trades')) || [];
        
        if (trades.length === 0) {
            document.getElementById('win-rate').textContent = '0%';
            document.getElementById('avg-win').textContent = '$0.00';
            document.getElementById('avg-loss').textContent = '$0.00';
            document.getElementById('profit-factor').textContent = '0.00';
            return;
        }
        
        // Calculate win rate
        const winningTrades = trades.filter(trade => trade.result >= 0);
        const winRate = (winningTrades.length / trades.length) * 100;
        document.getElementById('win-rate').textContent = `${winRate.toFixed(1)}%`;
        
        // Calculate average win
        const avgWin = winningTrades.length > 0 ? 
            winningTrades.reduce((sum, trade) => sum + trade.result, 0) / winningTrades.length : 0;
        document.getElementById('avg-win').textContent = `$${avgWin.toFixed(2)}`;
        
        // Calculate average loss
        const losingTrades = trades.filter(trade => trade.result < 0);
        const avgLoss = losingTrades.length > 0 ? 
            losingTrades.reduce((sum, trade) => sum + Math.abs(trade.result), 0) / losingTrades.length : 0;
        document.getElementById('avg-loss').textContent = `$${avgLoss.toFixed(2)}`;
        
        // Calculate profit factor
        const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.result, 0);
        const totalLoss = losingTrades.reduce((sum, trade) => sum + Math.abs(trade.result), 0);
        const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
        
        if (profitFactor === Infinity) {
            document.getElementById('profit-factor').textContent = '∞';
        } else {
            document.getElementById('profit-factor').textContent = profitFactor.toFixed(2);
        }
    }
    
    // Initialize charts
    function initCharts() {
        const profitCtx = document.getElementById('profitChart').getContext('2d');
        const winRateCtx = document.getElementById('winRateChart').getContext('2d');
        
        profitChart = new Chart(profitCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Cumulative Profit',
                    data: [],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Profit Over Time'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `$${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return `$${value}`;
                            }
                        }
                    }
                }
            }
        });
        
        winRateChart = new Chart(winRateCtx, {
            type: 'doughnut',
            data: {
                labels: ['Winning Trades', 'Losing Trades'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ['#27ae60', '#e74c3c'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Win Rate'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
        
        updateCharts();
    }
    
    // Update charts with current data
    function updateCharts() {
        const trades = JSON.parse(localStorage.getItem('trades')) || [];
        
        if (trades.length === 0) {
            profitChart.data.labels = [];
            profitChart.data.datasets[0].data = [];
            winRateChart.data.datasets[0].data = [0, 0];
            
            profitChart.update();
            winRateChart.update();
            return;
        }
        
        // Sort trades by date
        const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Prepare data for profit chart
        const dates = [];
        const cumulativeProfit = [];
        let runningTotal = 0;
        
        sortedTrades.forEach(trade => {
            dates.push(formatDate(trade.date, true));
            runningTotal += trade.result;
            cumulativeProfit.push(runningTotal);
        });
        
        profitChart.data.labels = dates;
        profitChart.data.datasets[0].data = cumulativeProfit;
        profitChart.update();
        
        // Prepare data for win rate chart
        const winningTrades = trades.filter(trade => trade.result >= 0).length;
        const losingTrades = trades.length - winningTrades;
        
        winRateChart.data.datasets[0].data = [winningTrades, losingTrades];
        winRateChart.update();
    }
    
    // Helper function to format date
    function formatDate(dateString, short = false) {
        const date = new Date(dateString);
        
        if (short) {
            return date.toLocaleDateString();
        }
        
        return date.toLocaleString();
    }
});
