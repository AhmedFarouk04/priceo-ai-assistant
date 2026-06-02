// Normalizes routed Priceo payloads before sending context to the LLM.
export function normalizeDataForAnswer({ intent, data }) {
  switch (intent) {
    case "product_search":
      return normalizeProductSearchLike(data);
    case "wishlist":
      return normalizeWishlist(data);
    case "user_orders":
      return normalizeUserOrders(data);
    case "admin_orders_stats":
      return normalizeAdminOrderStats(data);
    case "admin_sales_statistics":
      return normalizeAdminSalesStats(data);
    case "cart":
      return normalizeCart(data);
    case "user_notifications":
      return normalizeUserNotifications(data);
    case "admin_notifications":
      return normalizeAdminNotifications(data);
    case "admin_complaints":
      return normalizeAdminComplaints(data);
    case "admin_coupons":
      return normalizeAdminCoupons(data);
    case "coupon_details":
      return normalizeCouponDetails(data);
    case "policy_question":
      return data;
    default:
      return data;
  }
}

function extractProductArray(data) {
  if (Array.isArray(data?.data)) {
    return data.data;
  }
  if (Array.isArray(data?.products)) {
    return data.products;
  }
  if (Array.isArray(data?.data?.products)) {
    return data.data.products;
  }
  if (Array.isArray(data?.wishlist)) {
    return data.wishlist;
  }
  return [];
}

function normalizeProduct(item) {
  return {
    id: item?._id || item?.id || null,
    title: item?.title || null,
    price: item?.price ?? null,
    priceAfterDiscount: item?.priceAfterDiscount ?? null,
    quantity: item?.quantity ?? null,
    category:
      typeof item?.category === "string"
        ? item.category
        : item?.category?.name || item?.category?.title || null,
    rating: item?.ratingsAverage ?? item?.rating ?? null,
  };
}

function normalizeProductSearchLike(data) {
  const productsArray = extractProductArray(data);

  return {
    results: data?.results ?? productsArray.length,
    products: productsArray.slice(0, 5).map(normalizeProduct),
    note: data?.note || null,
  };
}

function normalizeWishlist(data) {
  const productsArray = extractProductArray(data);
  return {
    results: data?.results ?? productsArray.length,
    products: productsArray.slice(0, 5).map(normalizeProduct),
  };
}

function normalizeUserOrders(data) {
  const activeOrders = Array.isArray(data?.activeOrders) ? data.activeOrders : [];
  const completedOrders = Array.isArray(data?.completedOrders)
    ? data.completedOrders
    : [];

  return {
    results: data?.results ?? activeOrders.length + completedOrders.length,
    activeOrdersCount: activeOrders.length,
    completedOrdersCount: completedOrders.length,
    activeOrders: activeOrders.slice(0, 3).map(normalizeOrderItem),
    completedOrders: completedOrders.slice(0, 3).map(normalizeOrderItem),
  };
}

function normalizeOrderItem(order) {
  const products = Array.isArray(order?.products) ? order.products : [];
  return {
    id: order?.id || order?._id || null,
    totalOrderPrice: order?.totalOrderPrice ?? null,
    createdAt: order?.createdAt || null,
    deliveredAt: order?.deliveredAt || null,
    products: products
      .map((p) => p?.title)
      .filter(Boolean)
      .slice(0, 10),
  };
}

function normalizeAdminOrderStats(data) {
  const stats = data?.data || data || {};
  return {
    totalOrders: stats?.totalOrders ?? 0,
    completedOrders: stats?.completedOrders ?? 0,
    activeOrders: stats?.activeOrders ?? 0,
  };
}

function normalizeAdminSalesStats(data) {
  const yearsMap = data?.data || {};
  const currentYear = String(new Date().getFullYear());
  const months = Array.isArray(yearsMap[currentYear]) ? yearsMap[currentYear] : [];

  return {
    year: currentYear,
    months: months.map((m) => ({
      month: m?.month ?? null,
      monthName: m?.monthName || null,
      totalSales: m?.totalSales ?? 0,
      ordersCount: m?.ordersCount ?? 0,
      completedOrders: m?.completedOrders ?? 0,
    })),
  };
}

function normalizeCart(data) {
  const noCartMessage = "No cart found for this user.";

  if (!data || data?.status === 404 || data?.error === "NO_CART") {
    return {
      hasCart: false,
      message: noCartMessage,
    };
  }

  const cartRoot = data?.data || data;
  const cartItems = Array.isArray(cartRoot?.cartItems)
    ? cartRoot.cartItems
    : Array.isArray(cartRoot?.items)
      ? cartRoot.items
      : [];

  if (!cartItems.length && cartRoot?.numOfCartItems == null) {
    return {
      hasCart: false,
      message: noCartMessage,
    };
  }

  return {
    hasCart: true,
    numOfCartItems: cartRoot?.numOfCartItems ?? cartItems.length,
    totalCartPrice: cartRoot?.totalCartPrice ?? null,
    totalPriceAfterDiscount: cartRoot?.totalPriceAfterDiscount ?? null,
    taxPrice: cartRoot?.taxPrice ?? null,
    shippingPrice: cartRoot?.shippingPrice ?? null,
    items: cartItems.slice(0, 5).map((item) => ({
      title:
        item?.product?.title || item?.title || item?.productTitle || "Unknown",
      quantity: item?.quantity ?? 0,
      price: item?.price ?? item?.product?.price ?? null,
    })),
  };
}

function normalizeUserNotifications(data) {
  const list = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.notifications)
      ? data.notifications
      : [];

  return {
    count: data?.count ?? list.length,
    unreadCount:
      data?.unreadCount ??
      list.filter((item) => item?.isRead === false).length,
    notifications: list.slice(0, 5).map((item) => ({
      id: item?._id || item?.id || null,
      title: item?.title || null,
      subject: item?.subject || null,
      isRead: item?.isRead ?? null,
      createdAt: item?.createdAt || null,
    })),
  };
}

function normalizeAdminNotifications(data) {
  const list = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.notifications)
      ? data.notifications
      : [];

  return {
    count: data?.count ?? list.length,
    notifications: list.slice(0, 5).map((item) => ({
      id: item?._id || item?.id || null,
      subject: item?.subject || item?.title || null,
      sendTo: item?.sendTo || null,
      adminName: item?.adminName || item?.admin?.name || null,
      createdAt: item?.createdAt || null,
    })),
  };
}

function normalizeAdminComplaints(data) {
  const list = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.complaints)
      ? data.complaints
      : [];

  return {
    count: data?.count ?? list.length,
    complaints: list.slice(0, 5).map((item) => ({
      id: item?._id || item?.id || null,
      subject: item?.subject || item?.title || null,
      userName: item?.userName || item?.user?.name || null,
      userRole: item?.userRole || item?.user?.role || null,
      createdAt: item?.createdAt || null,
    })),
  };
}

function normalizeAdminCoupons(data) {
  const list = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.coupons)
      ? data.coupons
      : [];

  return {
    count: data?.count ?? list.length,
    coupons: list.slice(0, 10).map((item) => ({
      id: item?._id || item?.id || null,
      name: item?.name || null,
      discount: item?.discount ?? null,
      expire: item?.expire || null,
    })),
  };
}

function normalizeCouponDetails(data) {
  const item = data?.data || data?.coupon || data || {};
  return {
    id: item?._id || item?.id || null,
    name: item?.name || null,
    discount: item?.discount ?? null,
    expire: item?.expire || null,
    createdAt: item?.createdAt || null,
  };
}
