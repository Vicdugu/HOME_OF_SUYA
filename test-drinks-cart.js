/**
 * Test script to verify drinks are added as individual items to the cart
 * Run this in the browser console while on localhost:3000
 */

// Function to test drinks cart behavior
async function testDrinksCart() {
  console.log("🧪 Starting drinks cart test...\n");

  // Test 1: Check if drinks meal exists in the DOM
  console.log("Test 1: Checking if Drinks meal card exists...");
  const drinkCard = Array.from(document.querySelectorAll("article")).find(
    (article) => article.textContent.includes("Drinks")
  );
  if (!drinkCard) {
    console.error("❌ Drinks card not found");
    return;
  }
  console.log("✅ Drinks card found\n");

  // Test 2: Click on drink options (select multiple drinks)
  console.log("Test 2: Selecting multiple drinks...");
  const drinkOptions = drinkCard.querySelectorAll("button");
  const zoboBtn = Array.from(drinkOptions).find((btn) =>
    btn.textContent.includes("Zobo")
  );
  const kunuAyaBtn = Array.from(drinkOptions).find((btn) =>
    btn.textContent.includes("Kunu Aya")
  );

  if (zoboBtn && kunuAyaBtn) {
    zoboBtn.click();
    console.log("  ✓ Selected Zobo");
    kunuAyaBtn.click();
    console.log("  ✓ Selected Kunu Aya");
    console.log("✅ Multiple drinks selected\n");
  } else {
    console.error("❌ Could not find drink options");
    return;
  }

  // Test 3: Find and click "Add to Order" button
  console.log("Test 3: Adding drinks to cart...");
  const addBtn = Array.from(drinkCard.querySelectorAll("button")).find(
    (btn) => btn.textContent.includes("Add to Order")
  );
  if (addBtn) {
    addBtn.click();
    console.log("  ✓ Clicked 'Add to Order'");
    await new Promise((r) => setTimeout(r, 500)); // Wait for cart update
    console.log("✅ Drinks added\n");
  } else {
    console.error("❌ Add to Order button not found");
    return;
  }

  // Test 4: Check cart badge and open cart
  console.log("Test 4: Checking cart badge...");
  const cartBadge = document.querySelector("[aria-label*='cart']");
  const cartBtn = Array.from(document.querySelectorAll("button")).find(
    (btn) => btn.getAttribute("aria-label")?.includes("cart")
  );
  if (cartBtn) {
    cartBtn.click();
    console.log("  ✓ Opened cart");
    await new Promise((r) => setTimeout(r, 500));
    console.log("✅ Cart opened\n");
  }

  // Test 5: Verify individual drink items in cart
  console.log("Test 5: Verifying individual drink items in cart...");
  const cartItems = document.querySelectorAll('[role="dialog"] [class*="p-3"]');
  console.log(`  Found ${cartItems.length} items in cart`);
  
  cartItems.forEach((item, idx) => {
    const itemName = item.querySelector("p:first-child")?.textContent || "";
    const price = item.querySelector("[class*='brand-gold']")?.textContent || "";
    console.log(`  Item ${idx + 1}: ${itemName} - ${price}`);
  });

  if (cartItems.length >= 2) {
    console.log("✅ Multiple items found (drinks are individual items!)\n");
  } else {
    console.error(
      "❌ Expected at least 2 items, found " + cartItems.length + "\n"
    );
  }

  // Test 6: Check quantity selectors
  console.log("Test 6: Checking quantity selectors...");
  const quantitySelectors = document.querySelectorAll(
    '[role="dialog"] [class*="QuantitySelector"]'
  );
  console.log(`  Found ${quantitySelectors.length} quantity selectors`);
  if (quantitySelectors.length >= 2) {
    console.log("✅ Each drink has its own quantity selector\n");
  } else {
    console.error("❌ Not enough quantity selectors found\n");
  }

  console.log("🎉 Tests completed!");
}

// Run tests
testDrinksCart();
