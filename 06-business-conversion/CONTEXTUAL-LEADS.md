# 06 · Contextual leads

A visitor who has already used a calculator knows what they want. Contact actions should carry that context, so the first message is useful to both sides.

---

## 1. Contact link with context

A plain `wa.me/<number>` link leaves the visitor to write the first message, and many leave. Build the message from the visitor's last action:

```ts
const contactLink = (context: {
  page: string
  monthlyBill?: number
  powerKw?: number
  productId?: string
}) => {
  const phone = '[international number, digits only]'
  let text = 'Hello, I would like information. '
  if (context.monthlyBill) {
    text += `My monthly bill is about ${context.monthlyBill} €; the estimate was ${context.powerKw} kW. `
  }
  if (context.productId) {
    text += `I am interested in: ${context.productId}. `
  }
  text += 'Could you confirm availability and the grants that apply?'
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}
```

The visitor only has to press send. The message is in the visitor's language (from the i18n layer, not hard-coded).

---

## 2. Summary document

After a calculation, offer a summary the visitor can keep: the inputs, the result, the equipment and the contact. Generate it in the browser. Ask for a phone number or email before the download, and say why.

---

## 3. Offline queue

If the connection drops during a form submission, keep the data in `IndexedDB` (or `localStorage` for very small forms), show a neutral "saved, will be sent" message, and send it when the connection returns. A lead must not be lost because of a dropped connection.

Remove stored leads after the server confirms receipt.
