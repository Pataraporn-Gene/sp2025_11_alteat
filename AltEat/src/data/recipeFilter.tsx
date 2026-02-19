// Capitalize first letter
const capitalize = (word: string) =>
  word.charAt(0).toUpperCase() + word.slice(1);

// Sort array
const formatAndSort = (arr: string[]) =>
  [...arr] // avoid mutating original
    .map(capitalize)
    .sort((a, b) => a.localeCompare(b));

export const recipeFilter = [
  {
    ingredient: formatAndSort([
      "Garlic",
      "Onion",
      "Ginger",
      "Shallots",
      "Carrot",
      "Tomato",
      "Bell Pepper",
      "Mushroom",
      "Spinach",
      "Broccoli",
      "Potato",
      "Chicken",
      "Fish",
      "Shrimp",
      "Pork",
      "Beef",
      "Egg",
      "Cheese",
      "Milk",
      "Sugar",
      "Oil",
      "Basil",
      "Butter",
      "Cilantro",
    ]),
    method: formatAndSort([
      "Boil",
      "Fry",
      "Grill",
      "Steam",
      "Bake",
      "Roast",
      "Stir-fry",
      "Sauté",
      "Simmer",
    ]),
    cuisine: formatAndSort([
      "Thai",
      "Japanese",
      "Korean",
      "American",
      "French",
      "Italian",
      "Chinese",
      "Indian",
      "Mexican",
    ]),
    // menu: formatAndSort([]),
  },
];
