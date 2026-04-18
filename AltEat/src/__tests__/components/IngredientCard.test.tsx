import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import IngredientCard from "../../component/IngredientCard";
import type { IngredientDetail } from "../../component/IngredientDetailPopup";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("../../component/IngredientDetailPopup", () => ({
  default: ({
    ingredient,
    isOpen,
  }: {
    ingredient: IngredientDetail | null;
    isOpen: boolean;
  }) =>
    isOpen && ingredient ? (
      <div data-testid="ingredient-popup">{ingredient.ingredient_name}</div>
    ) : null,
}));

describe("IngredientCard", () => {
  const ingredient: IngredientDetail = {
    ingredient_id: 1,
    img_src: "https://via.placeholder.com/300",
    ingredient_name: "Apple",
    type: "Fruit",
    has_benefit: null,
    has_texture: ["Crunchy"],
    has_color: ["Red"],
    has_shape: null,
    has_other_names: null,
    can_cook: null,
    has_mineral: null,
    has_flavor: ["Sweet", "Tart"],
    has_vitamin: null,
    has_nutrient: null,
  };

  it("renders ingredient info and tags", () => {
    render(<IngredientCard ingredients={[ingredient]} />);

    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Fruit")).toBeInTheDocument();
    expect(screen.getByText("Sweet")).toBeInTheDocument();
    expect(screen.getByText("Tart")).toBeInTheDocument();
    expect(screen.getByText("Crunchy")).toBeInTheDocument();
    expect(screen.getByText("Red")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "detail.moreDetail" }),
    ).toBeInTheDocument();
  });
  
  it("renders ingredient image with correct src and alt text", () => {
    render(<IngredientCard ingredients={[ingredient]} />);

    const image = screen.getByRole("img", { name: "Apple" });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute(
      "src",
      "https://yrpoikxovgaplilgwfys.supabase.co/storage/v1/object/public/ingredients_img/1.jpg",
    );
    expect(image).toHaveAttribute("alt", "Apple");
  });

  it("shows fallback initial when image fails to load", async () => {
    render(<IngredientCard ingredients={[ingredient]} />);

    const image = screen.getByRole("img", { name: "Apple" });

    // Simulate image load failure
    fireEvent.error(image);

    // Image should be gone, fallback initial should appear
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("opens the detail popup when clicking more detail", async () => {
    const user = userEvent.setup();

    render(<IngredientCard ingredients={[ingredient]} />);

    await user.click(screen.getByRole("button", { name: "detail.moreDetail" }));

    expect(screen.getByTestId("ingredient-popup")).toHaveTextContent("Apple");
  });
});
