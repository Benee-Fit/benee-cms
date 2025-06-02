import { config } from 'dotenv';
config();

import '@/ai/flows/filter-extracted-benefits-info.ts';
import '@/ai/flows/answer-benefits-question.ts';
import '@/ai/flows/pdf-filler.ts';