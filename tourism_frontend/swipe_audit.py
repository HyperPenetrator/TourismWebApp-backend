from playwright.sync_api import sync_playwright
import time
import os

def run_swipe_audit():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Monitor console for [MCP] logs
        mcp_calls = []
        page.on("console", lambda msg: mcp_calls.append(msg.text) if "[MCP]" in msg.text else None)
        
        print("Navigating to http://localhost:3000...")
        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')
        
        # Find the card stack
        # Looking at SwipeableFeed.tsx, the card has "cursor-grab" class
        print("Locating swipeable cards...")
        cards = page.locator('.cursor-grab')
        if cards.count() == 0:
            print("No cards found. Taking screenshot for debugging.")
            page.screenshot(path='swipe_audit_debug.png')
            browser.close()
            return

        # Perform rapid swipes
        # Swipe right = deploy, Swipe left = archive
        directions = ['right', 'left', 'right', 'right', 'left']
        print(f"Executing {len(directions)} rapid swipes...")
        
        start_time = time.time()
        for i, direction in enumerate(directions):
            # Get the bounding box of the top card
            box = cards.first.bounding_box()
            if not box:
                print(f"Card {i} not visible.")
                break
                
            center_x = box['x'] + box['width'] / 2
            center_y = box['y'] + box['height'] / 2
            
            # Drag
            target_x = center_x + 300 if direction == 'right' else center_x - 300
            page.mouse.move(center_x, center_y)
            page.mouse.down()
            page.mouse.move(target_x, center_y, steps=5) # Fast move
            page.mouse.up()
            
            # Small delay to allow the animation to start but still "rapid"
            # In a real "frenzy", this would be very short
            # page.wait_for_timeout(100) 
        
        end_time = time.time()
        print(f"Swipes completed in {end_time - start_time:.2f} seconds.")
        
        # Wait a bit for all calls to finish
        page.wait_for_timeout(2000)
        
        print("\n--- MCP Call Log ---")
        for call in mcp_calls:
            print(call)
        print("--------------------\n")
        
        page.screenshot(path='swipe_audit_result.png')
        browser.close()

if __name__ == "__main__":
    run_swipe_audit()
