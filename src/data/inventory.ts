export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockLevel: number;
  quantity: number;
  imageUrl: string;
  status: 'normal' | 'low' | 'out_of_stock';
}

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Samsung Galaxy S21 Ultra',
    sku: 'SAM-S21-BLK',
    price: 899.00,
    stockLevel: 85,
    quantity: 42,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGjYQDjqc2GILCXd3_X8QyINxgbzAlwP8xcfypb7ayIwCju6yheaMKqbYbB5_nzTvenSn6b-BgiG13nD9v446_qYnf7vLLa2YhYJFKd9b0nJjjG-JRhPp3khjYEX9Pc809GLWOyR8kTAXlsSyS4XE753AQTfvkutKjchIdfkVagIUerDqwSvjl1soBcI7dvLEZrS5Hdi8ltXrI96j7_SBo3G_EBRYmcWqlb0AUuDE4dhMyxtP9ICMedAYA1lVCbc1UD24QkK_fUzA',
    status: 'normal',
  },
  {
    id: '2',
    name: 'Sony WH-1000XM4',
    sku: 'SNY-XM4-GRY',
    price: 349.99,
    stockLevel: 12,
    quantity: 3,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbkVOt4DteH6G05GpkJwkOAEIA7Tmh9ZMVG9yr0ERiXmhDwKXewghN4CUvXm0Y6l5fwSU_GAlkzxOudDGq9BJNmrcgm7xlZnXdPZz5IMdX4apj_QS2QXU0zGZ6z2mhdye6wp_g9niNhNxgD0ClVVklZIOzzxoCGYbHTLdiPE8noo907YF5StTPAcHpuq9zJfvtgEG8yzhKxsy3hiXrLhDX8P7zMKxVQvHp0kKbyLXjzVqyiy7UHubcYzZ4rbaIOdZUngAupsJFIJs',
    status: 'low',
  },
  {
    id: '3',
    name: 'Cargador Apple 96W USB-C',
    sku: 'APL-PWR-96W',
    price: 79.00,
    stockLevel: 54,
    quantity: 128,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2T05Zez1S9SohXoQRqTDb0mIdqEyd92GpT8UQ4P_sz4xMNWAyPujhNnl7OxvSje-lCB0Ly64ox6YDHyTxCRhR5EOAtJnwkS_buECzn2otdTKn5HTx7oyxK6DWx-7Z-Af0DJUS-rY7PmkKVipj_Ws2VhvbMV5FqohhohrjvreRoAG_nawGseOUkoqYOQ8BHnBmmHDjA9GS8cBWKPOHd5LZ4o3JwDNfqRO-ToOF-PXXyOQKAPFml7f9yOswxVSIf1bKHJwH0I550E4',
    status: 'normal',
  },
  {
    id: '4',
    name: 'LG UltraWide 34WL500',
    sku: 'LG-34WL-500',
    price: 399.99,
    stockLevel: 0,
    quantity: 0,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbkdwK5HAS6YNN-cYIbu003tJLGqzc08DN7WcPnMU3Hkc6pFpeNQJG6L8Mzhb2jkFhc6jpF9ZwfXtVhKleOC2qeHl66_MpcKcFqq5xFDIQu3CiO8ItiRlKuIkpNkx6wpBzabBzmqEsYK0B5ZeutasGko3SOQLLSvFV2wEQm5Xkfw8VvvZLDfZrA-u2CnTGvqvGKt_bcbaccqQu1Cn2s8ZZ_HJHYZHND5Nph5yNb7qUJd-woS3MTml6Q55MjYgU9H1TjrayVPgJT1I',
    status: 'out_of_stock',
  }
];