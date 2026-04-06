import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the new hero and proof CTA", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: /make the campaign feel live before the ad account even exists/i
      })
    ).toBeInTheDocument();

    expect(screen.getAllByRole("link", { name: /book a strategy call/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /see the proof stack/i })).toBeInTheDocument();
  });
});
