-- Dados da carteira de eleitor podem ser preenchidos depois
ALTER TABLE eleitores
  ALTER COLUMN titulo_eleitor DROP NOT NULL,
  ALTER COLUMN secao_eleitoral DROP NOT NULL,
  ALTER COLUMN municipio_eleitoral DROP NOT NULL,
  ALTER COLUMN zona_eleitoral_id DROP NOT NULL;
