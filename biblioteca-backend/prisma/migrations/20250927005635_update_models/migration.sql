-- CreateTable
CREATE TABLE "public"."livros" (
    "id" TEXT NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "autor" VARCHAR(100) NOT NULL,
    "isbn" VARCHAR(17) NOT NULL,
    "categoria" TEXT NOT NULL,
    "ano_publicacao" INTEGER NOT NULL,
    "editora" VARCHAR(100),
    "paginas" INTEGER,
    "sinopse" VARCHAR(1000),
    "capa_url" TEXT,
    "disponivel" BOOLEAN NOT NULL,
    "quantidade_total" INTEGER NOT NULL DEFAULT 1,
    "quantidade_disponivel" INTEGER NOT NULL DEFAULT 1,
    "localizacao" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "livros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."emprestimos" (
    "id" TEXT NOT NULL,
    "livro_id" TEXT NOT NULL,
    "usuario_nome" VARCHAR(100) NOT NULL,
    "usuario_email" TEXT NOT NULL,
    "usuario_telefone" TEXT,
    "data_emprestimo" TIMESTAMP(3) NOT NULL,
    "data_devolucao_prevista" TIMESTAMP(3) NOT NULL,
    "data_devolucao_real" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "observacoes" VARCHAR(500),
    "multa" DOUBLE PRECISION DEFAULT 0,
    "renovacoes" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emprestimos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reservas" (
    "id" TEXT NOT NULL,
    "livro_id" TEXT NOT NULL,
    "usuario_nome" VARCHAR(100) NOT NULL,
    "usuario_email" TEXT NOT NULL,
    "usuario_telefone" TEXT,
    "data_reserva" TIMESTAMP(3) NOT NULL,
    "data_expiracao" TIMESTAMP(3),
    "data_notificacao" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "prioridade" INTEGER DEFAULT 1,
    "observacoes" VARCHAR(300),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categorias" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "codigo" VARCHAR(10) NOT NULL,
    "descricao" VARCHAR(200),
    "cor" VARCHAR(7),
    "ativa" BOOLEAN NOT NULL,
    "ordem" INTEGER DEFAULT 1,
    "total_livros" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."autores" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "nome_artistico" VARCHAR(100),
    "biografia" VARCHAR(1000),
    "data_nascimento" TIMESTAMP(3),
    "data_falecimento" TIMESTAMP(3),
    "nacionalidade" VARCHAR(50),
    "generosLiterarios" TEXT[],
    "foto_url" TEXT,
    "site_oficial" TEXT,
    "ativo" BOOLEAN NOT NULL,
    "total_livros" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "livros_isbn_key" ON "public"."livros"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_codigo_key" ON "public"."categorias"("codigo");

-- AddForeignKey
ALTER TABLE "public"."emprestimos" ADD CONSTRAINT "emprestimos_livro_id_fkey" FOREIGN KEY ("livro_id") REFERENCES "public"."livros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservas" ADD CONSTRAINT "reservas_livro_id_fkey" FOREIGN KEY ("livro_id") REFERENCES "public"."livros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
