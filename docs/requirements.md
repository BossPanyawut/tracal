# MVP requirements

TRACAL calculates crypto and XAU/USD trading cost, net sale proceeds, profit/loss, ROI, and break-even price. It displays USD results and THB estimates without requiring an account.

## Included

- Bitcoin, Ethereum, and gold selection
- Gold quantities in troy ounces or grams
- Buy/sell prices entered manually; reference market quote can be copied into sell price
- Fixed USD or percentage fees for each side, defaulting to Binance Spot Regular User at 0.100% per trade
- Current Coinbase USD/THB quote with BOT daily-reference fallback, or manual FX
- Source, market/fetch timestamp, and stale state for live values
- Real-time calculation, reset, keyboard/mobile input, and responsive layout

## Explicitly excluded

Order execution, exchange API keys, investment advice, authentication, persistence, portfolio accounting, tax estimation, and guaranteed settlement prices.

## Acceptance case

For 0.1 BTC bought at USD 50,000 and sold at USD 60,000 with no fees and USD/THB 34, total cost is USD 5,000, net sale is USD 6,000, profit is USD 1,000 / THB 34,000, and ROI is 20%.
