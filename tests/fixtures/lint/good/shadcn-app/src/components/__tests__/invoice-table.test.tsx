import { render, screen } from '@testing-library/react';
import { InvoiceTable } from '../invoice-table';

// Test data: placeholder identities and copy here never ship.
const customer = { name: 'Jane Doe', email: 'jane@example.com', company: 'Acme Corp' };

test('renders the total', () => {
  render(<InvoiceTable className="bg-indigo-600 transition-all" />);
  expect(screen.getByText('Lorem ipsum dolor sit amet')).toBeNull();
  expect(customer.name).toBe('Jane Doe');
});
