import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Simple component for testing
function TestComponent({ title }: { title: string }) {
  return (
    <div>
      <h1>{title}</h1>
      <p>This is a test component</p>
    </div>
  );
}

describe("TestComponent", () => {
  it("should render the title correctly", () => {
    render(<TestComponent title="Hello World" />);
    
    expect(screen.getByText("Hello World")).toBeInTheDocument();
    expect(screen.getByText("This is a test component")).toBeInTheDocument();
  });

  it("should render with different title", () => {
    render(<TestComponent title="Different Title" />);
    
    expect(screen.getByText("Different Title")).toBeInTheDocument();
  });
});