import type { Customer } from "../types/Customer";
import { getApiBaseUrl } from "./apiConfig";

function getCustomersUrl(): string {
    return `${getApiBaseUrl()}/api/customers`;
}

export async function getCustomers(): Promise<Customer[]> {
    const response = await fetch(
        getCustomersUrl()
    );

    if (!response.ok) {
        throw new Error(
            "Failed to retrieve customers."
        );
    }

    return response.json();
}

export async function createCustomer(
    customer: Omit<Customer, "id">
): Promise<Customer> {
    const response = await fetch(
        getCustomersUrl(),
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
            },
            body: JSON.stringify(customer),
        }
    );

    if (!response.ok) {
        throw new Error(
            "Failed to create customer."
        );
    }

    return response.json();
}

export async function updateCustomer(
    customer: Customer
): Promise<void> {
    const response = await fetch(
        `${getCustomersUrl()}/${customer.id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type":
                    "application/json",
            },
            body: JSON.stringify(customer),
        }
    );

    if (!response.ok) {
        throw new Error(
            "Failed to update customer."
        );
    }
}

export async function deleteCustomer(
    id: number
): Promise<void> {
    const response = await fetch(
        `${getCustomersUrl()}/${id}`,
        {
            method: "DELETE",
        }
    );

    if (!response.ok) {
        throw new Error(
            `Failed to delete customer: ${response.status}`
        );
    }
}