import { ProductMapping } from '../types';

export interface DetectedProduct {
    id?: string;
    name?: string;
    price?: number;
    quantity?: number;
    [key: string]: any;
}
export declare class ProductDetector {
    private productMapping;
    constructor(productMapping: ProductMapping);
    private cleanProductMapping;
    private cleanSelector;
    detectProducts(): DetectedProduct[];
    private detectProductsWithFieldsMapping;
    private findCommonParentSelector;
    private extractProductFromFieldsMapping;
    private detectCommonProducts;
    private extractProductFromCommonElement;
    private extractValue;
    private extractTextContent;
    private extractPrice;
    private extractQuantity;
}
//# sourceMappingURL=product-detector.d.ts.map