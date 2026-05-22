const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // Users
  const senhaAdmin = await bcrypt.hash('admin123', 10);
  const senhaGarcom = await bcrypt.hash('garcom123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bar.com' },
    update: {},
    create: { nome: 'Admin', email: 'admin@bar.com', senha: senhaAdmin, role: 'ADMIN' },
  });

  const garcom = await prisma.user.upsert({
    where: { email: 'garcom@bar.com' },
    update: {},
    create: { nome: 'Garçom João', email: 'garcom@bar.com', senha: senhaGarcom, role: 'GARCOM' },
  });

  console.log('Usuários criados:', admin.email, garcom.email);

  // Terminais
  const termBar = await prisma.terminal.upsert({
    where: { id: 'terminal-bar-001' },
    update: {},
    create: { id: 'terminal-bar-001', nome: 'Bar', cor: '#3B82F6', icone: 'GlassWater', ordem: 1 },
  });

  const termCozinha1 = await prisma.terminal.upsert({
    where: { id: 'terminal-cozinha-001' },
    update: {},
    create: { id: 'terminal-cozinha-001', nome: 'Cozinha 1', cor: '#F97316', icone: 'ChefHat', ordem: 2 },
  });

  const termCozinha2 = await prisma.terminal.upsert({
    where: { id: 'terminal-cozinha-002' },
    update: {},
    create: { id: 'terminal-cozinha-002', nome: 'Cozinha 2', cor: '#EF4444', icone: 'Flame', ordem: 3 },
  });

  console.log('Terminais criados');

  // Categorias
  const catBebidas = await prisma.categoria.upsert({
    where: { id: 'cat-bebidas-001' },
    update: {},
    create: { id: 'cat-bebidas-001', nome: 'Bebidas', ordem: 1 },
  });

  const catPetiscos = await prisma.categoria.upsert({
    where: { id: 'cat-petiscos-001' },
    update: {},
    create: { id: 'cat-petiscos-001', nome: 'Petiscos', ordem: 2 },
  });

  const catPratos = await prisma.categoria.upsert({
    where: { id: 'cat-pratos-001' },
    update: {},
    create: { id: 'cat-pratos-001', nome: 'Pratos Principais', ordem: 3 },
  });

  const catSobremesas = await prisma.categoria.upsert({
    where: { id: 'cat-sobremesas-001' },
    update: {},
    create: { id: 'cat-sobremesas-001', nome: 'Sobremesas', ordem: 4 },
  });

  console.log('Categorias criadas');

  // Produtos
  const produtos = [
    { id: 'prod-001', nome: 'Cerveja Artesanal', descricao: 'IPA gelada 500ml', preco: 18.90, categoriaId: catBebidas.id, terminalId: termBar.id },
    { id: 'prod-002', nome: 'Chopp Premium', descricao: 'Chopp gelado 400ml', preco: 14.00, categoriaId: catBebidas.id, terminalId: termBar.id },
    { id: 'prod-003', nome: 'Caipirinha', descricao: 'Limão, açúcar e cachaça artesanal', preco: 22.00, categoriaId: catBebidas.id, terminalId: termBar.id },
    { id: 'prod-004', nome: 'Refrigerante Lata', descricao: 'Coca-Cola, Guaraná, Sprite 350ml', preco: 8.00, categoriaId: catBebidas.id, terminalId: termBar.id },
    { id: 'prod-005', nome: 'Porção de Fritas', descricao: 'Batata frita crocante com molho especial', preco: 32.00, categoriaId: catPetiscos.id, terminalId: termCozinha1.id },
    { id: 'prod-006', nome: 'Bolinho de Bacalhau', descricao: '6 unidades com creme azedo', preco: 38.00, categoriaId: catPetiscos.id, terminalId: termCozinha1.id },
    { id: 'prod-007', nome: 'Filé Mignon', descricao: '250g ao ponto com fritas e salada', preco: 89.00, categoriaId: catPratos.id, terminalId: termCozinha2.id },
    { id: 'prod-008', nome: 'Hambúrguer Artesanal', descricao: 'Blend 180g, queijo cheddar, bacon, fritas', preco: 52.00, categoriaId: catPratos.id, terminalId: termCozinha2.id },
    { id: 'prod-009', nome: 'Petit Gateau', descricao: 'Com sorvete de creme e calda de chocolate', preco: 28.00, categoriaId: catSobremesas.id, terminalId: termCozinha1.id },
    { id: 'prod-010', nome: 'Pudim de Leite', descricao: 'Pudim cremoso com calda de caramelo', preco: 18.00, categoriaId: catSobremesas.id, terminalId: termCozinha1.id },
  ];

  for (const prod of produtos) {
    await prisma.produto.upsert({
      where: { id: prod.id },
      update: {},
      create: prod,
    });
    await prisma.estoque.upsert({
      where: { produtoId: prod.id },
      update: {},
      create: { produtoId: prod.id, quantidade: 50, minimo: 5 },
    });
  }

  console.log('Produtos criados');

  // Mesas
  for (let i = 1; i <= 10; i++) {
    await prisma.mesa.upsert({
      where: { numero: i },
      update: {},
      create: { numero: i },
    });
  }

  console.log('Mesas criadas');
  console.log('Seed concluído!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
