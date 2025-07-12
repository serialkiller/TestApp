-- Create API configurations table
CREATE TABLE IF NOT EXISTS api_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  api_key TEXT NOT NULL,
  provider VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_api_configs_provider ON api_configs(provider);
CREATE INDEX IF NOT EXISTS idx_api_configs_active ON api_configs(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE api_configs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on api_configs" ON api_configs
  FOR ALL USING (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_api_configs_updated_at 
  BEFORE UPDATE ON api_configs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample configurations (optional)
-- INSERT INTO api_configs (name, api_key, provider, is_active) VALUES
--   ('OpenAI Production', 'your-openai-api-key-here', 'openai', true),
--   ('OpenAI Development', 'your-dev-openai-api-key-here', 'openai', false); 