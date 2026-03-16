export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'active' | 'vacation' | 'license';
  imageUrl: string;
}

export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Andrés Silva',
    role: 'Gerente de Ventas',
    department: 'Ventas',
    status: 'active',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLl3f_4liySJzw48IR6fVjHtsx894c97KWWsl41LpwrIwMMCtR6X7XTzurNIz1vQlXr28_QRCncGc8YkfCRzBjf3D51s94qfQ-WQfEUEX329-U92eG8y0kswPnQKm8OCfiJ1FYCeUkiLOrrEJsenBrR0Fn0-GpRVgs3LK9ndKsAE4ivbk_KvJod9td7-Dfp_iQPhcVTz68jVTF3lrtj9m4jSsaenkScm2zp2wFhVYnPbRNRdb7OOXTN5W_1XTNHtsflUWn8NvIQQQ'
  },
  {
    id: '2',
    name: 'Carolina Méndez',
    role: 'Jefa de Operaciones',
    department: 'Operaciones',
    status: 'vacation',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1dWr-fwsv44wjZjr6LQPbPnsOx2dvUcTBuvBkR2vqJgHEpVGZhjNdEbcluqf00QkFtWsAW-Io1LV7CNFfxuLFncXziSo8wLvhlnD3ou-Hn3OGR0TKa9HO-5coMzOTmEzphZbopDqmTZq4pUyaD7ozG4B939_SdsxJ8BduLRGM9QnNJmkff4p0Alt8LaqM6BKJGgVhzOw4CiX2870MLHk8v6simMqCHFVtDT0NsrFoYXyPuQB1VItH9YKzdgthmvx48VynmzMssBQ'
  },
  {
    id: '3',
    name: 'Ricardo Tapia',
    role: 'Analista de Sistemas',
    department: 'Tecnología',
    status: 'license',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfN-t7cNgwXCU-p7SaELMl7P22u10szrG_hO4XhR2iCyDtw1mnSLcYqKEqOJuZqVr2KA2JsdZd_oBNhGryWdJUlI1JY32AOpAGKbaiNd_WtxeY5XjB4GVlYTbHo1_mLW1g37zCfDtbcMqCwM3hX0eVMRoUYBDWXE_TctOvIGXQp-_D3Fy3zET3qM3JCpElU81-csQgg4yHd5VkkzQy3w_lbhddbFOFnvr9_q8hWXSQZPIcueo5gOMtE1a3JhWBvelGMjeA9crZNwQ'
  },
  {
    id: '4',
    name: 'Isabel Riquelme',
    role: 'Contadora Senior',
    department: 'Finanzas',
    status: 'active',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBebN_TpjBCDNXSljgzSjDK316uFKru0028O5lumE5WQUeeSFo8RPJmr15V_S9kZT5rC4NNQBUEclsj-XaUv4VJvZp-fCn7KXrAJV4nelS_J37gaYkn1Bp65oDPGsC7NAB5NOmDA8nm_MIFvgrCqstLiw6DLT-UYpoByq-nbuWLh0vEcgiF0yQk14ZwTo4XdLCqdGimvb7jPLF-e0EpCUlUSXS2RAGgtkSWy9GexBVx-NAUeWWpKUf6G3S-ZD3ShxcPO1uGr2a21xs'
  },
  {
    id: '5',
    name: 'Mauricio Soto',
    role: 'Desarrollador Fullstack',
    department: 'Tecnología',
    status: 'active',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtZJW1sBmGzTgmRe04F2YZurarQpngCN8KcZknY-gm4K03bS2m-h2-LkZumE8UMlSs-NT0d_j8dZY8M2h1XpTFgYjvEeETEihyswaLWHWzg7laMGx4tKnZXYjxzrPRHpCFd4k3SpQJ91Uy16EqZ6J3vEZYHDpfc8rPA4SON7x5TuosyYIUPwVMashdSEpaKmwivljwFDeN_iN9W6QH-gbV5OH7LEsx_mMgKHcDGZkAcyPYvDjTyr71uAFqBXEwxxZ1zvumUrWV2hk'
  },
  {
    id: '6',
    name: 'Valentina Jara',
    role: 'Diseñadora UI/UX',
    department: 'Marketing',
    status: 'active',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARxTvGnnEvlWohoG9gvBDqkYcJq8wAYbfc_b7OCG-oG5mR6TaOe0CRuGYrJWbPRlrn7BPZTFsgT_Pfk7_GICSOrzVHyp8_b4oVAOnaTIrmnlX55tYmeP_-Wk39OrmiPG-aYjCnbZgF7qygjP42FxN8C6SRgqmjWm6B1YIITen5WFp0XMNAU1lyV6yWgMONOt2zrZhFJSJ7NMnRshcPW8B1PWlaVeofLol7crQeT2UCAIq2Bkq2TLTZ6U0qclggL4kx_6GJQZC3eg0'
  }
];