export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: string;
}

export const mockCatalogProducts: CatalogProduct[] = [
  {
    id: '1',
    sku: 'ELEC-001',
    name: 'Smartphone X1 Pro',
    price: 499990,
    stock: 12,
    category: 'Electrónica',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjN_z7OSMr7ZkmLQvd2z4eewGz0GVp1KUGLN-n3QntVe27t_2fKQ8e3hn_asyPq98vka3b6U54fl8tqvNNXFuhv2a0YFTFT9yQJARlNncwf5q9cSgSsxadlUhJM63z2n7AlN-Uxqw0O5xlthp5JAwqEKeSDUjFyVSj827Nn1fxKOnUNVEs6Ll8kPkqCkoYo0s0twyEmyMq6lWFKkt2FVgPEXBPWvAtuY-2jAYo0xatzqrgUl_cavBJsDLXJ48UDBniQy07V3hYwWw'
  },
  {
    id: '2',
    sku: 'COMP-042',
    name: 'Laptop Pro 15" M2',
    price: 850000,
    stock: 3,
    category: 'Electrónica',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOErbYgWdJp1hd-9eGxyOh19kVb1Wciv6tSviLUkKOb0KnzY9Dcfa5y-qyOYwKNx9hf2m_3aTy0ARdPSI3dL76fEl23amShoAdR3-S34RxHdyMB9XCzGxkvVJ-y_VF48YqziWk8AThSrqsXsrC3oA2RJqOKS-KiB-scxqhSntxHGi3oEs3TdM3xSUpeXGnGd4wAHjZDKVIn2Um5tG7zDO6LMvJMDb-ynqwuE8R3jdp124T-bmKChd2GsklyXGozMJrBBrXBhGKO_g'
  },
  {
    id: '3',
    sku: 'AUDI-099',
    name: 'Audífonos BT Noise',
    price: 45000,
    stock: 48,
    category: 'Electrónica',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOp9CBRPUyHa6OLL4DGDirHrcXVfQXHBon3cwE9iW7m_5NQjLdPRfHx1Zq_WIwtrXGg-JxfH0YCulObpwvGlwj_T8AA2iRwrlvgrdyKD6TVGsWvIiF8iIP8Obmg0g0PaYi2f4BIKvJmr-LydYDXPH2QsfMWmjDwVdwFPLuhXyHHQmnB3JKqxtHddrRtkESXq7p_Vtq8Zx6EiYxeMppO2wRvI_Ay172bbHcPSyJyFdFiC94y5FaCL3aw9qnjezyJDq-svdH-13HWdk'
  },
  {
    id: '4',
    sku: 'FOTO-015',
    name: 'Cámara Pro 4K Kit',
    price: 320000,
    stock: 8,
    category: 'Electrónica',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBb-agoEE2EeYXu3WbG4TwKkd8HEltKk7i7wnegZGca0w1glvVLJlZpa09ow0W9beYe5XGXOJm30TxfoTR7D3IGsrAIq60B_dAaPV_IU67hZ7MqmwzNxG8IwT9IdDYjvzrsMIj9U3VrdH7zQIvkCpyLMZ_TYWJ_1SDmriQt7OlijLaNHztcRpjTiPJxlKW0cm8QqnlhGhgWHbyY9fhnhdqduzbgbhO9JSsqErTiymGub8poVI1yIIgRm1rgRHPpKPiUaHeVzmfzfto'
  },
  {
    id: '5',
    sku: 'HERR-221',
    name: 'Taladro Impacto 20V',
    price: 125990,
    stock: 21,
    category: 'Ferretería',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNPvF48B_zZAJDeJDb5tTwgKVaiANM6MudPCjrjRVBIfm9BkDKQQCom6sgHKYQQM_BC1WvybUrqB_AmQ55uoxjPajIQS_4da-DxjZzuaI5nuGLj0zG9ufDDtWqi8tME0BGuKQKgGA3Ilz_Men_WkrtvSc4MtFmITs07JIC00szRr7PQywtWuTxtyhXAEFyeUBEAFURVEmsZKqRiYOPhI_ciMfr0-kl1s9wLi2O76cnKNjuRq_kmVJSz8cMJx9BaBXZYZhm9zGqFBE'
  },
  {
    id: '6',
    sku: 'ELEC-088',
    name: 'Smart TV 65" UHD',
    price: 549990,
    stock: 0,
    category: 'Electrónica',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRtOPbK0fgAgKk7pSef-nD-qX-SXMYsEMjVwYFmoiNfGs-38LomvUeeMyYnWDh6Gb6paAxBfmcBfZ6JFUfLKMI-rs67177cZuHmRJj1AyZPZId0-klGgd1x9cwFsjkzTv7z-ObuLbEdihk2GYlKENxd5qPWxoDfkH6ngLNPgNPOnJ8xdiKRFLQS47MczntWz0s8YBzxIbFLkVaxpkRgalUB83FhClVTT5opQryxFONTIMvb63x6zlfeLZvnWTMt_ZPYxRf2xJmPpQ'
  }
];