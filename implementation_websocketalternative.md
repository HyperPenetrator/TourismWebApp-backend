# WebSocket Alternative Implementation Plan

## Current State
Spot@NE uses WebSockets for three unidirectional server-to-client push use cases:
1. Real-time weaving telemetry (2s updates)
2. Live marketplace feed (new item broadcasts)
3. Social engagement notifications (like/comment/reshare alerts)

All use cases require only server-to-client communication, making Server-Sent Events (SSE) a better fit.

## Alternative Comparison
| Protocol | Pros | Cons | Use Case Fit |
|----------|------|------|--------------|
| SSE | Simple, auto-reconnect, HTTP-based, low overhead | Unidirectional only | All current Spot@NE use cases |
| Long Polling | Universal support, firewall-friendly | High latency, higher server load | Fallback for restricted environments |
| WebTransport | Very low latency, multiplexed | Limited browser support, high complexity | Future migration (2-3 years) |
| WebSocket (retain) | Bidirectional support | Higher complexity, no auto-reconnect, firewall issues | Unnecessary for current needs |

## Recommendation
Migrate all WebSocket endpoints to SSE, with Long Polling as an optional fallback.

## Implementation Steps
### Backend (FastAPI) [COMPLETE]
1. [x] Replace WebSocket endpoints with SSE using `StreamingResponse` + `text/event-stream`:
   - `GET /sse/weaving/{artisan_id}` instead of `/ws/weaving/{artisan_id}`
   - `GET /sse/feed` instead of `/ws/marketplace`/`/ws/feed`
   - `GET /sse/engagement/{post_id}` instead of `/ws/engagement/{post_id}`
2. [x] Update connection managers to use SSE broadcast (iterate over connections, send formatted SSE events)
3. [x] Add Last-Event-ID support for reconnection consistency

### Frontend (Next.js) [COMPLETE]
1. [x] Replace `useWebSocket` and `useMarketplaceFeedWS` hooks with SSE hooks using `EventSource` API
2. [x] Remove WebSocket-specific reconnection logic (handled natively by EventSource)
3. [x] Update component references to new SSE endpoints

### Testing [COMPLETE]
1. [x] Verify all three use cases work with SSE
2. [x] Test reconnection by disconnecting/reconnecting client
3. [x] Validate firewall compatibility

## Rollback Plan
Keep legacy WebSocket endpoints under `/legacy/ws/*` paths for fallback during transition.
