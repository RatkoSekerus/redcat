export interface Product {
  id: number;
  name: string;
  size: string;
  price: number;
  description: string;
}

export interface OrderDetails {
  productName: string;
  quantity: number;
  customerName: string;
  address: string;
  phone: string;
}
