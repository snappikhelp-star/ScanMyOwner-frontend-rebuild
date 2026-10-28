import { useState, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type CheckoutProduct = {
  id: string;
  name: string;
  offerPrice: number;
  status: 'proposed' | 'draft';
};

type ProductCheckoutDialogProps = {
  product: CheckoutProduct;
  onClose: () => void;
};

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

export default function ProductCheckoutDialog({
  product,
  onClose,
}: ProductCheckoutDialogProps) {
  const [submitted, setSubmitted] = useState(false);

  function submitOrderForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // No payment provider or order endpoint is configured. Never send or save
    // the entered personal details or represent this as a completed order.
    event.currentTarget.reset();
    setSubmitted(true);
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="checkout-dialog" data-testid="dialog-product-checkout">
        <DialogHeader className="checkout-dialog-header">
          <span className="checkout-eyebrow">Product checkout</span>
          <DialogTitle>Order the {product.name} Pack</DialogTitle>
          <DialogDescription>
            Review the selected package and enter the delivery details needed for an order.
          </DialogDescription>
        </DialogHeader>

        <div className="checkout-product-summary" data-testid="checkout-product-summary">
          <span>{product.name} Pack</span>
          <strong>{formatPrice(product.offerPrice)}</strong>
        </div>

        {product.status === 'draft' && (
          <p className="checkout-draft-note" data-testid="checkout-family-draft-note">
            Family Pack contents are still being confirmed. No order can be placed yet.
          </p>
        )}

        <div className="checkout-unavailable" role="status" data-testid="status-checkout-unavailable">
          Checkout is temporarily unavailable because secure payment processing is not configured.
          Your details will not be sent or saved, and no order will be placed.
        </div>

        {submitted && (
          <div className="checkout-submit-result" role="alert" data-testid="status-checkout-not-placed">
            No order was placed. The details you entered have been cleared and were not sent or saved.
          </div>
        )}

        <form className="checkout-form" onSubmit={submitOrderForm} data-testid="form-product-checkout">
          <label htmlFor={`checkout-name-${product.id}`}>
            Name
            <input
              id={`checkout-name-${product.id}`}
              name="customerName"
              required
              autoComplete="name"
              maxLength={100}
              data-testid="input-checkout-name"
            />
          </label>
          <label htmlFor={`checkout-mobile-${product.id}`}>
            Mobile number
            <input
              id={`checkout-mobile-${product.id}`}
              name="mobileNumber"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              minLength={7}
              maxLength={20}
              pattern="[0-9()+ -]{7,20}"
              title="Enter a valid mobile number, including a country code if needed."
              data-testid="input-checkout-mobile"
            />
          </label>
          <label htmlFor={`checkout-address-${product.id}`}>
            Delivery address
            <textarea
              id={`checkout-address-${product.id}`}
              name="deliveryAddress"
              autoComplete="street-address"
              required
              maxLength={500}
              rows={3}
              data-testid="input-checkout-address"
            />
          </label>
          <p className="checkout-data-note">
            We only ask for your name, mobile number, and delivery address. These details stay in this
            form and are discarded because checkout is not available.
          </p>
          <button className="btn btn-primary" type="submit" data-testid="button-checkout-submit">
            Check checkout availability
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
