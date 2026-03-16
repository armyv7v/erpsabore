export interface Branch {
  id: string;
  name: string;
  type: string;
  address: string;
  stockTotal: string;
  stockStatus: string;
  stockStatusColor: 'green' | 'red';
  salesToday: string;
  salesStatus: string;
  employeesCount: number;
  employeesStatus: string;
  imageUrl: string;
}

export const mockBranches: Branch[] = [
  {
    id: '1',
    name: 'Casa Matriz - Providencia',
    type: 'Operativa',
    address: 'Av. Andrés Bello 2425, Santiago, Región Metropolitana',
    stockTotal: '15,400',
    stockStatus: '+2.5% vs ayer',
    stockStatusColor: 'green',
    salesToday: '$2.45M',
    salesStatus: '85% meta diaria',
    employeesCount: 45,
    employeesStatus: 'Activos ahora',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIPTIB0cu-wWH-J6Ht7bD9uLOf_VGDtS6EYyTf0XHklP2sx1cEFuUWzo3qwdc2Ii1e0VSypWlQUrp8fS-TpuzIPU0OJWyc2L5Mh6K3STPa5j_cf_YviLNgfdDexcsLXxMAoHHK1oq1W4YMiE7UqQzpCjfkSe8ySPa4CWwzB1l-tRU1alZ3HTsIzGXnjMT2Ghyq0AFiWTEr7388B1Yw-tLBWF3is9wbb3z9nNRfk9kB-SoGGqdK97MZlSrw41GOcFsIdwCdrZYxZC4'
  },
  {
    id: '2',
    name: 'Bodega Norte - Quilicura',
    type: 'Logística',
    address: 'Panamericana Norte 8000, Quilicura, Región Metropolitana',
    stockTotal: '82,150',
    stockStatus: '-1.2% stock out',
    stockStatusColor: 'red',
    salesToday: '$420k',
    salesStatus: 'Solo B2B',
    employeesCount: 12,
    employeesStatus: 'Turno rotativo',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcucJQT3h7qo4UDhcIm1FOVEFPSxmjRvz759tnrZF1Gv-Qhli4jDKbN2kuZVvKNB8O4g0I9b9xXbMjpB7yhn5CRr-VRqWbuysE60F3ytWAFKD18m9Fyd_IBOnx_U2tsXXE45FQkQSYKLE0qpPXsrHtyFyQJShfjJ0ZDqQOqfKDZTW3Ihyfmf7ZmJ7d5SrWeEwGQEyHXOjMplmIKuqyE9OwRoqoIFbogbxVheqMb1QPm51jn5Domah4r8Sn1ad0nqZOhyBpExgn4eg'
  },
  {
    id: '3',
    name: 'Tienda Centro - Santiago',
    type: 'Operativa',
    address: 'Paseo Ahumada 312, Santiago Centro, Región Metropolitana',
    stockTotal: '4,200',
    stockStatus: 'Reposición OK',
    stockStatusColor: 'green',
    salesToday: '$1.12M',
    salesStatus: '+12% vs ayer',
    employeesCount: 8,
    employeesStatus: 'Staff completo',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYGfStgF2Pp1r_twJqrlUeEHEJEoZyQ70BsWk6jUM9Z1edkKVq0oifbANUbg96ap_SodKQuR5pHDovXsfi2v5d2tBO-3DDYOsTXMYOOY09c8TvC8mbGFqy2WJRpRcj9IK-69y_ppdyJJ8hmF35ybvei4Cx63L2ay-kYGKZHCbMUhGlwI8sqfKUhXvNihfhEZTD5jvLplXL1ak-CK_RZU7VcomumKnqyGmqIOr4rZsB1SQm7ayoH8vTCRrkAN86cGI6_R9WtAWXIb0'
  }
];