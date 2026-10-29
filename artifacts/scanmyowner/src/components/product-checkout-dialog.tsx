import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';

const checkoutFormSchema = z.object({
  customerName: z.string().trim().min(2, 'Enter your full name.').max(100, 'Name must be 100 characters or fewer.'),
  email: z.string().trim().max(254, 'Email must be 254 characters or fewer.').refine((value) => !value || z.string().email().safeParse(value).success, 'Enter a valid email address.'),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number starting with 6–9.'),
  deliveryAddress: z.string().trim().min(10, 'Enter a complete delivery address.').max(500, 'Address must be 500 characters or fewer.'),
  cityDistrict: z.string().trim().min(2, 'Enter a city or district.').max(100, 'City or district must be 100 characters or fewer.'),
  state: z.string().min(1, 'Choose a state or Union Territory.'),
  pinCode: z.string().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit Indian PIN code.'),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

type CheckoutProduct = {
  id: string;
  name: string;
  offerPrice: number;
  status: 'proposed' | 'draft';
};

type ProductCheckoutDialogProps = {
  product: CheckoutProduct;
  quantity: number;
  onClose: () => void;
};

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

const indianStatesAndTerritories = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export default function ProductCheckoutDialog({
  product,
  quantity,
  onClose,
}: ProductCheckoutDialogProps) {
  const [reviewed, setReviewed] = useState(false);
  const subtotal = product.offerPrice * quantity;
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: '',
      email: '',
      mobileNumber: '',
      deliveryAddress: '',
      cityDistrict: '',
      state: '',
      pinCode: '',
    },
  });

  function reviewDetails(_details: CheckoutFormValues) {
    // This is only an in-browser form check. It never creates or submits an order.
    setReviewed(true);
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="checkout-dialog" data-testid="dialog-product-checkout">
        <DialogHeader className="checkout-dialog-header">
          <span className="checkout-eyebrow">Product checkout</span>
          <DialogTitle>Order the {product.name} Pack</DialogTitle>
          <DialogDescription>
            Review your pack and delivery details. This preview does not place an order.
          </DialogDescription>
        </DialogHeader>

        <div className="checkout-product-summary" data-testid="checkout-product-summary">
          <div className="checkout-summary-product">
            <span className="checkout-summary-name">{product.name} Pack</span>
            <span className="checkout-summary-unit">{formatPrice(product.offerPrice)} each × {quantity}</span>
          </div>
          <div className="checkout-summary-subtotal">
            <span>Subtotal</span>
            <strong data-testid="text-checkout-subtotal">{formatPrice(subtotal)}</strong>
          </div>
        </div>

        {product.status === 'draft' && (
          <p className="checkout-draft-note" data-testid="checkout-family-draft-note">
            Family Pack contents are still being confirmed. No inclusions are listed yet.
          </p>
        )}

        <div className="checkout-preview-note" role="note" data-testid="notice-checkout-preview">
          Preview only: orders and payments are not enabled. Your details stay in this form and are not sent or saved.
        </div>

        {reviewed && (
          <div className="checkout-submit-result" role="status" data-testid="status-checkout-details-reviewed">
            Your details passed the local format checks. Nothing was sent or saved, and no order was created.
          </div>
        )}

        <Form {...form}>
        <form className="checkout-form" onSubmit={form.handleSubmit(reviewDetails)} onChange={() => setReviewed(false)} noValidate data-testid="form-product-checkout">
          <label htmlFor={`checkout-name-${product.id}`}>
            Full name
            <input
              id={`checkout-name-${product.id}`}
              {...form.register('customerName')}
              required
              autoComplete="name"
              maxLength={100}
              placeholder="Your full name"
              aria-invalid={Boolean(form.formState.errors.customerName)}
              aria-describedby={form.formState.errors.customerName ? `checkout-name-error-${product.id}` : undefined}
              data-testid="input-checkout-name"
            />
            {form.formState.errors.customerName && <span className="checkout-field-error" id={`checkout-name-error-${product.id}`} role="alert">{form.formState.errors.customerName.message}</span>}
          </label>
          <label htmlFor={`checkout-email-${product.id}`}>
            Email address <span className="checkout-optional">(optional)</span>
            <input
              id={`checkout-email-${product.id}`}
              {...form.register('email')}
              type="email"
              autoComplete="email"
              maxLength={254}
              placeholder="you@example.com"
              aria-invalid={Boolean(form.formState.errors.email)}
              aria-describedby={form.formState.errors.email ? `checkout-email-error-${product.id}` : undefined}
              data-testid="input-checkout-email"
            />
            {form.formState.errors.email && <span className="checkout-field-error" id={`checkout-email-error-${product.id}`} role="alert">{form.formState.errors.email.message}</span>}
          </label>
          <label htmlFor={`checkout-mobile-${product.id}`}>
            10-digit Indian mobile number
            <input
              id={`checkout-mobile-${product.id}`}
              {...form.register('mobileNumber')}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              required
              maxLength={10}
              pattern="[6-9][0-9]{9}"
              title="Enter 10 digits, starting with 6, 7, 8 or 9."
              placeholder="9876543210"
              aria-invalid={Boolean(form.formState.errors.mobileNumber)}
              aria-describedby={form.formState.errors.mobileNumber ? `checkout-mobile-error-${product.id}` : undefined}
              data-testid="input-checkout-mobile"
            />
            {form.formState.errors.mobileNumber && <span className="checkout-field-error" id={`checkout-mobile-error-${product.id}`} role="alert">{form.formState.errors.mobileNumber.message}</span>}
          </label>
          <label htmlFor={`checkout-address-${product.id}`}>
            Complete delivery address
            <textarea
              id={`checkout-address-${product.id}`}
              {...form.register('deliveryAddress')}
              autoComplete="street-address"
              required
              maxLength={500}
              rows={3}
              placeholder="House / flat, building, street, area and landmark"
              aria-invalid={Boolean(form.formState.errors.deliveryAddress)}
              aria-describedby={form.formState.errors.deliveryAddress ? `checkout-address-error-${product.id}` : undefined}
              data-testid="input-checkout-address"
            />
            {form.formState.errors.deliveryAddress && <span className="checkout-field-error" id={`checkout-address-error-${product.id}`} role="alert">{form.formState.errors.deliveryAddress.message}</span>}
          </label>
          <div className="checkout-form-grid">
            <label htmlFor={`checkout-city-${product.id}`}>
              City / district
              <input
                id={`checkout-city-${product.id}`}
                {...form.register('cityDistrict')}
                autoComplete="address-level2"
                required
                maxLength={100}
                placeholder="City or district"
                aria-invalid={Boolean(form.formState.errors.cityDistrict)}
                aria-describedby={form.formState.errors.cityDistrict ? `checkout-city-error-${product.id}` : undefined}
                data-testid="input-checkout-city"
              />
              {form.formState.errors.cityDistrict && <span className="checkout-field-error" id={`checkout-city-error-${product.id}`} role="alert">{form.formState.errors.cityDistrict.message}</span>}
            </label>
            <label htmlFor={`checkout-state-${product.id}`}>
              State / Union Territory
              <select
                id={`checkout-state-${product.id}`}
                {...form.register('state')}
                autoComplete="address-level1"
                required
                aria-invalid={Boolean(form.formState.errors.state)}
                aria-describedby={form.formState.errors.state ? `checkout-state-error-${product.id}` : undefined}
                data-testid="select-checkout-state"
              >
                <option value="" disabled>Select state / UT</option>
                {indianStatesAndTerritories.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
              {form.formState.errors.state && <span className="checkout-field-error" id={`checkout-state-error-${product.id}`} role="alert">{form.formState.errors.state.message}</span>}
            </label>
            <label htmlFor={`checkout-pin-${product.id}`}>
              6-digit PIN code
              <input
                id={`checkout-pin-${product.id}`}
                {...form.register('pinCode')}
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                required
                maxLength={6}
                pattern="[1-9][0-9]{5}"
                title="Enter a valid 6-digit Indian PIN code."
                placeholder="110001"
                aria-invalid={Boolean(form.formState.errors.pinCode)}
                aria-describedby={form.formState.errors.pinCode ? `checkout-pin-error-${product.id}` : undefined}
                data-testid="input-checkout-pin"
              />
              {form.formState.errors.pinCode && <span className="checkout-field-error" id={`checkout-pin-error-${product.id}`} role="alert">{form.formState.errors.pinCode.message}</span>}
            </label>
          </div>
          <p className="checkout-data-note">
            The subtotal uses the displayed pack price and quantity. A secure order total must be recalculated on the server before real checkout is enabled.
          </p>
          <button className="btn btn-primary" type="submit" data-testid="button-checkout-review">
            Review details <span className="checkout-button-preview">· preview only</span>
          </button>
        </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
