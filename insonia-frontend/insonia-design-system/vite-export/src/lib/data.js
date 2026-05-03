// Mock data — replace with GraphQL calls via api.gql()
export const categorias = [
  { id: 1, name: 'Calçados', slug: 'calcados' },
  { id: 2, name: 'Vestuário', slug: 'vestuario' },
  { id: 3, name: 'Acessórios', slug: 'acessorios' },
  { id: 4, name: 'Equipamentos', slug: 'equipamentos' },
];

export const marcas = [
  { id: 1, name: 'Nike' }, { id: 2, name: 'Adidas' },
  { id: 3, name: 'Olympikus' }, { id: 4, name: 'Mizuno' },
  { id: 5, name: 'Asics' },
];

export const produtos = [
  { id: 1, name: 'Tênis Runner 3.0', sku: 'SKU-8421-BR', categoria: 1, marca: 1, preco_venda: 449.90, preco_custo: 210.00, quantidade: 24, letra: 'T' },
  { id: 2, name: 'Tênis Air Classic', sku: 'SKU-8422-BR', categoria: 1, marca: 1, preco_venda: 529.00, preco_custo: 248.00, quantidade: 8, letra: 'T' },
  { id: 3, name: 'Camiseta dry-fit M', sku: 'SKU-2103-BR', categoria: 2, marca: 2, preco_venda: 89.00, preco_custo: 32.00, quantidade: 42, letra: 'C' },
  { id: 4, name: 'Camiseta dry-fit G', sku: 'SKU-2104-BR', categoria: 2, marca: 2, preco_venda: 89.00, preco_custo: 32.00, quantidade: 37, letra: 'C' },
  { id: 5, name: 'Meia esportiva', sku: 'SKU-5511-BR', categoria: 3, marca: 3, preco_venda: 19.90, preco_custo: 6.50, quantidade: 120, letra: 'M' },
  { id: 6, name: 'Shorts corrida', sku: 'SKU-3301-BR', categoria: 2, marca: 4, preco_venda: 139.00, preco_custo: 58.00, quantidade: 15, letra: 'S' },
  { id: 7, name: 'Bermuda treino', sku: 'SKU-3302-BR', categoria: 2, marca: 2, preco_venda: 119.00, preco_custo: 48.00, quantidade: 22, letra: 'B' },
  { id: 8, name: 'Boné esportivo', sku: 'SKU-4401-BR', categoria: 3, marca: 1, preco_venda: 69.90, preco_custo: 22.00, quantidade: 33, letra: 'B' },
  { id: 9, name: 'Mochila 25L', sku: 'SKU-6601-BR', categoria: 4, marca: 2, preco_venda: 249.00, preco_custo: 118.00, quantidade: 11, letra: 'M' },
  { id: 10, name: 'Garrafa térmica 750ml', sku: 'SKU-7701-BR', categoria: 4, marca: 5, preco_venda: 79.00, preco_custo: 28.00, quantidade: 3, letra: 'G' },
  { id: 11, name: 'Regata treino', sku: 'SKU-2201-BR', categoria: 2, marca: 3, preco_venda: 59.00, preco_custo: 19.00, quantidade: 28, letra: 'R' },
  { id: 12, name: 'Tênis Trail Runner', sku: 'SKU-8423-BR', categoria: 1, marca: 5, preco_venda: 699.00, preco_custo: 320.00, quantidade: 0, letra: 'T' },
];

export const vendas = [
  { id: 234, data: '12/04/2026 14:32', itens: 3, valor_total: 568.80, lucro_total: 252.40, usuario: 'Tiago Monteiro', status: 'pago' },
  { id: 233, data: '12/04/2026 13:10', itens: 1, valor_total: 449.90, lucro_total: 239.90, usuario: 'Tiago Monteiro', status: 'pago' },
  { id: 232, data: '12/04/2026 11:05', itens: 5, valor_total: 297.50, lucro_total: 132.20, usuario: 'Maria Silva', status: 'pago' },
  { id: 231, data: '11/04/2026 18:42', itens: 2, valor_total: 699.00, lucro_total: 379.00, usuario: 'Tiago Monteiro', status: 'pago' },
  { id: 230, data: '11/04/2026 16:20', itens: 4, valor_total: 158.70, lucro_total: 72.30, usuario: 'Maria Silva', status: 'pago' },
  { id: 229, data: '11/04/2026 10:15', itens: 1, valor_total: 89.00, lucro_total: 57.00, usuario: 'Tiago Monteiro', status: 'pago' },
  { id: 228, data: '10/04/2026 17:55', itens: 6, valor_total: 412.60, lucro_total: 198.80, usuario: 'Maria Silva', status: 'pago' },
];

export function fmtBRL(n) {
  return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
export function fmtBRLCompact(n) {
  return n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
