// Centralized policy knowledge used by the assistant.
export const knowledgeBase = {
  paymentMethods: {
    ar: "تدعم Priceo الدفع عند الاستلام، كما تدعم الدفع الإلكتروني عبر Stripe بشكل آمن ومشفر. تشمل البطاقات المدعومة Visa و Mastercard وبطاقات الائتمان/الخصم المدعومة من Stripe. إذا فشل الدفع الإلكتروني فلن يتم إنشاء الطلب، ويمكن للمستخدم إعادة المحاولة أو اختيار طريقة دفع أخرى.",
    en: "Priceo supports Cash On Delivery and secure online card payments through Stripe. Supported cards include Visa, Mastercard, and Stripe-supported credit/debit cards. If online payment fails, the order is not created, and the user can retry or choose another payment method.",
  },
  shippingPolicy: {
    ar: "مدة التوصيل تعتمد على المنطقة وعادةً تستغرق عدة أيام عمل بعد تأكيد الطلب. قد تُطبق رسوم شحن حسب إعدادات التطبيق والمنطقة. يتم احتساب تكلفة الشحن تلقائيًا أثناء إتمام الطلب. يمكن للمستخدم متابعة حالة الطلب من قسم الطلبات. يكتمل الطلب عند الدفع والتسليم. إذا لم يتم شحن الطلب بعد، فيمكن للمستخدم التواصل مع الدعم لمعرفة إمكانية الإلغاء.",
    en: "Delivery time depends on the area and usually takes several business days after order confirmation. Shipping fees may apply depending on app settings and destination area. Shipping cost is calculated automatically during checkout. The user can track order status from the Orders section. The order is completed when paid and delivered. If the order has not shipped yet, the user should contact support to check cancellation possibility.",
  },
  couponsFaq: {
    ar: "يمكن تطبيق الكوبونات الصالحة قبل إتمام الشراء. يُطبق خصم الكوبون على إجمالي المنتجات قبل الشحن والضرائب. للكوبونات تواريخ انتهاء ولا يمكن استخدامها بعد انتهاء صلاحيتها.",
    en: "Valid coupons can be applied before checkout. The coupon discount is applied to the product total before shipping and tax. Coupons have expiry dates and cannot be used after expiry.",
  },
  support: {
    ar: "يمكن للمستخدم التواصل مع الدعم من خلال قسم \"Contact Us\" داخل التطبيق أو عبر قنوات Priceo الرسمية على وسائل التواصل الاجتماعي.",
    en: "The user can contact support through \"Contact Us\" inside the app or Priceo official social channels.",
  },
};
