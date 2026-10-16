import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CustomerDialog from "./CustomerDialog";

describe("CustomerDialog", () => {
    it("uses the edit heading and existing customer values", () => {
        render(<CustomerDialog open customer={{id: 7, name: "Alex Example", email: "alex@example.com"}}
            onSave={vi.fn()} onCancel={vi.fn()} />);
        expect(screen.getByRole("heading", {name: "Edit Customer"})).toBeInTheDocument();
        expect(screen.getByLabelText("Name")).toHaveValue("Alex Example");
    });

    it("rejects whitespace-only names", async () => {
        const save = vi.fn();
        render(<CustomerDialog open onSave={save} onCancel={vi.fn()} />);
        await userEvent.type(screen.getByLabelText("Name"), "   ");
        await userEvent.click(screen.getByRole("button", {name: "Save"}));
        expect(screen.getByRole("alert")).toHaveTextContent("Name is required.");
        expect(save).not.toHaveBeenCalled();
    });

    it("submits trimmed values", async () => {
        const save = vi.fn().mockResolvedValue(undefined);
        render(<CustomerDialog open onSave={save} onCancel={vi.fn()} />);
        await userEvent.type(screen.getByLabelText("Name"), "  Alex Example  ");
        await userEvent.type(screen.getByLabelText("Email"), "alex@example.com");
        await userEvent.click(screen.getByRole("button", {name: "Save"}));
        expect(save).toHaveBeenCalledExactlyOnceWith({name: "Alex Example", email: "alex@example.com"});
    });

    it("retains input and permits retry after a failed save", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        const save = vi.fn().mockRejectedValueOnce(new Error("Connection unavailable.")).mockResolvedValue(undefined);
        render(<CustomerDialog open onSave={save} onCancel={vi.fn()} />);
        await userEvent.type(screen.getByLabelText("Name"), "Alex Example");
        await userEvent.click(screen.getByRole("button", {name: "Save"}));
        expect(await screen.findByRole("alert")).toHaveTextContent("Connection unavailable.");
        expect(screen.getByLabelText("Name")).toHaveValue("Alex Example");
        await userEvent.click(screen.getByRole("button", {name: "Save"}));
        expect(save).toHaveBeenCalledTimes(2);
    });

    it("blocks duplicate submissions while saving", async () => {
        let resolve!: () => void;
        const save = vi.fn(() => new Promise<void>(done => { resolve = done; }));
        render(<CustomerDialog open onSave={save} onCancel={vi.fn()} />);
        await userEvent.type(screen.getByLabelText("Name"), "Alex Example");
        const form = screen.getByLabelText("Name").closest("form")!;
        fireEvent.submit(form);
        fireEvent.submit(form);
        expect(save).toHaveBeenCalledTimes(1);
        expect(screen.getByRole("button", {name: "Saving..."})).toBeDisabled();
        expect(screen.getByLabelText("Name")).toBeDisabled();
        await act(async () => resolve());
        expect(screen.getByRole("button", {name: "Save"})).toBeEnabled();
    });
});
