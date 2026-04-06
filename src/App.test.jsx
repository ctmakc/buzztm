import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the new hero and proof CTA", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: /launch on tiktok even when ads are off the table/i
      })
    ).toBeInTheDocument();

    expect(screen.getAllByRole("link", { name: /book a strategy call/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /see the proof wall/i })).toBeInTheDocument();
  });
});
