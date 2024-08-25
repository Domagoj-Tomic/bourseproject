document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container');
    const userId = container.getAttribute('data-user-id');
    const stripe = Stripe(container.getAttribute('data-stripe-public-key'));
    const openaiKey = container.getAttribute('data-openai-key');

        async function fetchStocks() {
        try {
            const response = await fetch('/api/stocks');
            const stocks = await response.json();
            displayStocks(stocks);
    
            const searchInput = document.getElementById('stockSearch');
            searchInput.addEventListener('input', () => {
                const query = searchInput.value.toLowerCase();
                const filteredStocks = stocks.filter(stock => 
                    stock.name.toLowerCase().includes(query) || 
                    stock.symbol.toLowerCase().includes(query)
                );
                displayStocks(filteredStocks);
            });
        } catch (err) {
            console.error('Error fetching stocks:', err);
        }
    }
    
    function displayStocks(stocks) {
        const stocksList = document.getElementById('stockList');
        stocksList.innerHTML = stocks.map(stock => `
            <div class="stock-item">
                <h2>${stock.name} (${stock.symbol})</h2>
                <p>Price: ${stock.price}</p>
                <p>Date: ${new Date(stock.date).toLocaleString()}</p>
                <button class="add-to-cart" data-stock-id="${stock.id}">Add to Cart</button>
            </div>
        `).join('');
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', () => {
                addToCart(button.dataset.stockId, 1);
            });
        });
    }

    async function fetchCart() {
        try {
            const response = await fetch('/api/cart', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const cartItems = await response.json();
            const cartItemsDiv = document.getElementById('cartItems');
            cartItemsDiv.innerHTML = cartItems.map(item => `
                <div class="cart-item">
                    <h3>${item.name} (${item.symbol})</h3>
                    <p>Quantity: ${item.quantity}</p>
                    <p>Price: ${item.price}</p>
                </div>
            `).join('');
        } catch (err) {
            console.error('Error fetching cart:', err);
        }
    }

    async function addToCart(stockId, quantity) {
        try {
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, stockId, quantity })
            });
            if (response.ok) {
                fetchCart();
            } else {
                console.error('Error adding to cart:', await response.json());
            }
        } catch (err) {
            console.error('Error adding to cart:', err);
        }
    }

    async function purchaseCart() {
        try {
            console.log('Starting purchaseCart function');
            const response = await fetch('/api/cart/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId })
            });
            console.log('Received response from /api/cart/purchase:', response);
            if (response.ok) {
                const data = await response.json();
                console.log('Response data:', data);
                if (data.success) {
                    console.log('Redirecting to Stripe checkout with URL:', data.redirectUrl);
                    window.location.href = data.redirectUrl;
                } else {
                    console.error('Error in response data:', data.error);
                }
            } else {
                console.error('Response not OK:', response.status, response.statusText);
                const errorData = await response.json();
                console.error('Error response data:', errorData);
            }
        } catch (err) {
            console.error('Error in purchaseCart function:', err);
        }
    }

    async function fetchRecommendations() {
        try {
            // Fetch the user's portfolio
            const portfolioResponse = await fetch('/api/portfolio');
            const portfolio = await portfolioResponse.json();
            const ownedStocks = portfolio.map(stock => stock.symbol);

            // Fetch recommendations from OpenAI
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a stock recommendation assistant.' },
                    { role: 'user', content: `Provide stock recommendations. The user already owns the following stocks: ${ownedStocks.join(', ')}.` }
                ],
                max_tokens: 100,
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${openaiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const recommendations = response.data.choices[0].message.content.trim().split('\n');
            displayRecommendations(recommendations);
        } catch (err) {
            console.error('Error fetching recommendations:', err);
        }
    }

    function displayRecommendations(recommendations) {
        const recommendationsDiv = document.getElementById('recommendations');
        recommendationsDiv.innerHTML = recommendations.map(rec => `
            <div class="recommendation-item">
                <p>${rec}</p>
            </div>
        `).join('');
    }


    document.getElementById('purchaseButton').addEventListener('click', purchaseCart);

    // Fetch stocks and cart on page load
    fetchStocks();
    fetchCart();
    fetchRecommendations(userId);

    // Poll for updates every 5 minutes (300000 milliseconds)
    setInterval(fetchStocks, 300000);
});