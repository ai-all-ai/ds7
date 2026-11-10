# 06-Business · Contextual Leads, WhatsApp Deep-Link & PDF Proposals

> Как конвертировать посетителей в квалифицированные заявки с максимальным закрытием в продажу.

---

## 1. Персонализированный WhatsApp Deep-Link

Обычная ссылка `wa.me/34613050156` заставляет пользователя самостоятельно придумывать текст. В 40% случаев он закрывает вкладку.

### Стандарт DS7:
При клике на любую кнопку связи («Consultar en WhatsApp», «Pedir estudio») скрипт формирует динамическую ссылку с **полным контекстом расчета**:

```ts
const generateWhatsAppLink = (context: {
  page: string
  monthlyBill?: number
  powerKw?: number
  productId?: string
}) => {
  const phone = '34613050156'
  let text = '¡Hola Mi Luz Solar! '
  if (context.monthlyBill) {
    text += `He calculado una instalación para mi factura de ${context.monthlyBill} €/mes (aprox. ${context.powerKw} kW). `
  }
  if (context.productId) {
    text += `Me interesa el equipo: ${context.productId}. `
  }
  text += '¿Podríais confirmarme la disponibilidad y subvenciones aplicables?'

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}
```

Клиент открывает WhatsApp — сообщение уже написано за него. Ему остается нажать кнопку «Отправить». Менеджер сразу видит параметры и моментально закрывает сделку.

---

## 2. Мгновенная генерация PDF-сметы в браузере

* После работы с калькулятором пользователю предлагается: **«Descargar propuesta técnica preliminar (PDF)»**;
* Прямо в браузере за 1 секунду формируется брендированный PDF с графиком окупаемости, перечнем оборудования и контактами;
* Условие получения — ввод телефона или email;
* Конверсия возрастает в 2–3 раза по сравнению с обычной формой обратного звонка.

---

## 3. Оффлайн-очередь заявок (Offline Lead Queue)

При кратковременном обрыве мобильного интернета форма не выдает красную ошибку. Данные сохраняются в `IndexedDB / localStorage` и автоматически отправляются на сервер сразу при восстановлении сетевого соединения. Ни один лид не теряется.
