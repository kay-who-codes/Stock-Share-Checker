document.addEventListener('DOMContentLoaded', function() {
    const calculateBtn = document.getElementById('calculateBtn');
    calculateBtn.addEventListener('click', calculateInvestmentStats);
    
    // Set default date to today if not set
    const purchaseDateInput = document.getElementById('purchaseDate');
    if (!purchaseDateInput.value) {
        const today = new Date().toISOString().split('T')[0];
        purchaseDateInput.value = today;
    }
});

async function calculateInvestmentStats() {
    // Show loading spinner
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('results').style.display = 'none';
    
    // Get user inputs
    const symbol = document.getElementById('symbol').value.toUpperCase();
    const purchasePrice = parseFloat(document.getElementById('purchasePrice').value);
    const shares = parseInt(document.getElementById('shares').value);
    const dividendRate = parseFloat(document.getElementById('dividendRate').value);
    const purchaseDate = document.getElementById('purchaseDate').value;
    
    try {
        // Fetch current stock price
        const currentPrice = await getCurrentStockPrice(symbol);
        
        // Calculate time differences
        const purchaseDateObj = new Date(purchaseDate);
        const today = new Date();
        const daysHeld = Math.floor((today - purchaseDateObj) / (1000 * 60 * 60 * 24));
        const yearsHeld = daysHeld / 365;
        
        // General calculations
        const originalTotalValue = purchasePrice * shares;
        const currentTotalValue = currentPrice * shares;
        const priceDifference = currentPrice - purchasePrice;
        const percentDifference = (priceDifference / purchasePrice) * 100;
        const totalValueDifference = priceDifference * shares;
        const totalPercentChange = (currentTotalValue - originalTotalValue) / originalTotalValue * 100;
        const annualizedReturn = yearsHeld > 0 ? (Math.pow(1 + totalPercentChange/100, 1/yearsHeld) - 1) * 100 : 0;
        
        // Dividend calculations
        const annualDividendPerShare = purchasePrice * (dividendRate / 100);
        const dividendsEarned = annualDividendPerShare * shares * (daysHeld / 365);
        
        // Update the UI with results
        updateResults({
            symbol,
            currentPrice,
            purchasePrice,
            originalTotalValue,
            currentTotalValue,
            daysHeld,
            priceDifference,
            percentDifference,
            totalValueDifference,
            annualizedReturn,
            annualDividendPerShare,
            dividendsEarned,
            shares
        });
        
    } catch (error) {
        alert(`Error: ${error.message}`);
    } finally {
        // Hide loading spinner
        document.getElementById('loading').style.display = 'none';
        document.getElementById('results').style.display = 'block';
    }
}

async function getCurrentStockPrice(symbol) {
    // Note: The Yahoo Finance API used here may have limitations
    // For a production app, consider using a dedicated financial data API
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
            throw new Error('No data available for this symbol');
        }
        
        return data.chart.result[0].meta.regularMarketPrice;
    } catch (error) {
        console.error('Error fetching stock price:', error);
        throw new Error('Failed to fetch current stock price. Please try again later.');
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}

function formatPercentage(value) {
    return value.toFixed(2) + '%';
}

function updateResults(data) {
    // Update general stats
    document.getElementById('currentPrice').textContent = formatCurrency(data.currentPrice);
    document.getElementById('purchasePriceDisplay').textContent = formatCurrency(data.purchasePrice);
    document.getElementById('originalValue').textContent = formatCurrency(data.originalTotalValue);
    document.getElementById('currentValue').textContent = formatCurrency(data.currentTotalValue);
    document.getElementById('daysHeld').textContent = data.daysHeld;
    
    // Format price difference with color
    const priceChangeElement = document.getElementById('priceChange');
    priceChangeElement.textContent = `${formatCurrency(data.priceDifference)} (${formatPercentage(data.percentDifference)})`;
    priceChangeElement.className = data.priceDifference >= 0 ? 'stat-value positive' : 'stat-value negative';
    
    // Format total change with color
    const totalChangeElement = document.getElementById('totalChange');
    totalChangeElement.textContent = `${formatCurrency(data.totalValueDifference)} (${formatPercentage(data.totalPercentChange)})`;
    totalChangeElement.className = data.totalValueDifference >= 0 ? 'stat-value positive' : 'stat-value negative';
    
    // Format annualized return with color
    const annualizedReturnElement = document.getElementById('annualizedReturn');
    annualizedReturnElement.textContent = formatPercentage(data.annualizedReturn);
    annualizedReturnElement.className = data.annualizedReturn >= 0 ? 'stat-value positive' : 'stat-value negative';
    
    // Update dividend stats
    document.getElementById('dividendsEarned').textContent = formatCurrency(data.dividendsEarned);
    document.getElementById('dailyDividend').textContent = formatCurrency(data.annualDividendPerShare * data.shares / 365);
    document.getElementById('weeklyDividend').textContent = formatCurrency(data.annualDividendPerShare * data.shares / 52);
    document.getElementById('monthlyDividend').textContent = formatCurrency(data.annualDividendPerShare * data.shares / 12);
    document.getElementById('annualDividend').textContent = formatCurrency(data.annualDividendPerShare * data.shares);
    document.getElementById('dividendPerShare').textContent = formatCurrency(data.annualDividendPerShare);
    document.getElementById('tenYearProjection').textContent = formatCurrency(data.annualDividendPerShare * data.shares * 10);
}