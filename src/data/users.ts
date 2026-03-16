export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  imageUrl?: string;
}

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Carlos Rodríguez',
    email: 'carlos.r@empresa.com',
    role: 'Admin',
    status: 'active',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8nUtUZ1mkQL3PkpK1gnvPcy9tOg1eP-FU-M67ky7kAq4Rf4tOu96GKBkbjqPZvNX1JQNqYYnmsmZ_yqiLprA6Mm-Qg-S8N2nP-MSI4TVMN1laJFm7Sf7BTgCGJCLTXzYD31i866VepKD_-moRIkuJpoEJmlMvYq_I48etH-JgMXODoPEoBzQcnrLQtqCJ-192eFZswcD3w2wRcctLHrxVwScqlhXTW_gpJLWMjlfP_TwxNkbtVD4emTp8YFhFVmF5p4uQcnDhtlY'
  },
  {
    id: '2',
    name: 'Ana Martínez',
    email: 'ana.m@empresa.com',
    role: 'Vendedor',
    status: 'active',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_s1spXuudI_ic4mIgluUNqPQDpsqItRsiLn6jWFVYqPnfGb7QZA9WvakiiaETxTL0e2d-f5kElJ_iQrZQSsF9L4ELKLixEofcUacFwjzIhAD8H3RF_zqnuFeCesjDkQfFChfNFssNNFvvo5Xib-tENnL0d7jtR810ItNV2sa8CTZ7SOKwtta_FYgN734Iq0G5iJMj2DKL9XlD7A29AX-Vivt2cKg-bt3Xh72zLzM17G8EmBnre1bonPkDI8rZF_-5VYKNNXUmc3E'
  },
  {
    id: '3',
    name: 'Roberto Gil',
    email: 'roberto.g@empresa.com',
    role: 'Contador',
    status: 'inactive',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDllgM1LSN4axZRNzxXRVn3C2uREkgAJCMclWMJs-uN8wYnIBDchvxA62L9Bsb-aCwCkUTvqeiVfJ9ZHiMjDlQ3JGfqAoK3cwkMO8I7mpBZuORYoW02bEnvBGac25FakdAjQSGa4lXPeDIO8ASB5UZhDZLawPMpXo33KhgQDcSZvLZHmNq-u5x90xNLbbJ_dP94rqF7XM0Zp56KRmLHlvy7hhuXtE4cD2x_rxbC8b12MjLLW1yJtnrDBqdD_VL-m_ovoU5prDCGXU'
  },
  {
    id: '4',
    name: 'Invitación enviada',
    email: 'lucia.v@empresa.com',
    role: 'Pendiente',
    status: 'pending',
  },
  {
    id: '5',
    name: 'Marta Sánchez',
    email: 'marta.s@empresa.com',
    role: 'Soporte',
    status: 'active',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDf9n4wZBdHmjixWAqIZVpzbdroE_FEHet2ZvgJXOVlxlXYBtQ72dJWcCB84PeAB8-XyRVIYWDswkbG9dUy6rDeGQHjrPK1sksXa0MhbtWK4_G_1qZH2BGwox6hZueQViln_fiTh4Tt-xEzqsCzyIAgQm2fHsIJGhNU7PUqpaf5MVFYPSG2RKTno0oUToLXekxJqqgagUuJcsMP39eCSnjYPFkmoZdBWrCB3tKJMb-De1fstfTlL7BLZvojmYnSCF6hJxCyNj6Rr3U'
  }
];