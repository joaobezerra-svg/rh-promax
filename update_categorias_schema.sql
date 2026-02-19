-- Add icone and cor columns to categorias table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categorias' AND column_name = 'icone') THEN
        ALTER TABLE categorias ADD COLUMN icone TEXT DEFAULT 'Folder';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categorias' AND column_name = 'cor') THEN
        ALTER TABLE categorias ADD COLUMN cor TEXT DEFAULT 'purple';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categorias' AND column_name = 'link_csv') THEN
        ALTER TABLE categorias ADD COLUMN link_csv TEXT;
    END IF;
END $$;
