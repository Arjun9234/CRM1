
"use client";

import type { SegmentRule } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, PlusCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface RuleBuilderProps {
  rules: SegmentRule[];
  onRulesChange: (rules: SegmentRule[]) => void;
  logic: 'AND' | 'OR';
  onLogicChange: (logic: 'AND' | 'OR') => void;
  disabled?: boolean;
}

const availableFields = [
  { value: "totalSpend", label: "Total Spend (INR)" },
  { value: "purchaseFrequency", label: "Purchase Frequency (count)" },
  { value: "lastPurchaseDays", label: "Days Since Last Purchase" },
  { value: "city", label: "City (text)" },
  { value: "country", label: "Country (text)" },
  { value: "productViewed", label: "Viewed Product (text, product ID/name)"},
  { value: "signedUpDays", label: "Days Since Sign-up"}
];

const operatorsByFieldType: Record<string, { value: string; label: string }[]> = {
  number: [
    { value: "eq", label: "Equals (=)" },
    { value: "gt", label: "Greater than (>)" },
    { value: "lt", label: "Less than (<)" },
    { value: "gte", label: "Greater than or equal to (>=)" },
    { value: "lte", label: "Less than or equal to (<=)" },
  ],
  string: [
    { value: "eq", label: "Equals" },
    { value: "contains", label: "Contains" },
    { value: "startsWith", label: "Starts with" },
    { value: "endsWith", label: "Ends with" },
  ],
};

const fieldTypes: Record<string, 'number' | 'string'> = {
  totalSpend: "number",
  purchaseFrequency: "number",
  lastPurchaseDays: "number",
  city: "string",
  country: "string",
  productViewed: "string",
  signedUpDays: "number",
};


export function RuleBuilder({ rules, onRulesChange, logic, onLogicChange, disabled = false }: RuleBuilderProps) {
  const addRule = () => {
    const newRule: SegmentRule = {
      id: Date.now().toString(),
      field: availableFields[0].value,
      operator: operatorsByFieldType[fieldTypes[availableFields[0].value]][0].value,
      value: "",
    };
    onRulesChange([...rules, newRule]);
  };

  const updateRule = (index: number, updatedRule: Partial<SegmentRule>) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], ...updatedRule };
    
    if (updatedRule.field) {
      const newFieldType = fieldTypes[updatedRule.field];
      const currentOperatorIsValid = operatorsByFieldType[newFieldType]?.some(op => op.value === newRules[index].operator);
      if (!currentOperatorIsValid) {
        newRules[index].operator = operatorsByFieldType[newFieldType]?.[0]?.value || '';
      }
    }
    onRulesChange(newRules);
  };

  const removeRule = (index: number) => {
    onRulesChange(rules.filter((_, i) => i !== index));
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manual Audience Rule Builder</CardTitle>
        <CardDescription>Define specific criteria for your customer segment.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rules.map((rule, index) => {
          const currentFieldType = fieldTypes[rule.field] || 'string';
          const availableOperators = operatorsByFieldType[currentFieldType] || operatorsByFieldType['string'];
          return (
            <div key={rule.id} className="flex flex-col sm:flex-row gap-2 items-end p-3 border rounded-md bg-muted/20 relative">
              {index > 0 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-1 text-sm text-muted-foreground">
                  {logic}
                </div>
              )}
              <div className="flex-1 space-y-1 w-full sm:w-auto">
                <Label htmlFor={`field-${index}`}>Field</Label>
                <Select
                  value={rule.field}
                  onValueChange={(value) => updateRule(index, { field: value })}
                  disabled={disabled}
                >
                  <SelectTrigger id={`field-${index}`} disabled={disabled}>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-1 w-full sm:w-auto">
                <Label htmlFor={`operator-${index}`}>Operator</Label>
                <Select
                  value={rule.operator}
                  onValueChange={(value) => updateRule(index, { operator: value })}
                  disabled={disabled}
                >
                  <SelectTrigger id={`operator-${index}`} disabled={disabled}>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOperators.map((op) => (
                       <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-1 w-full sm:w-auto">
                <Label htmlFor={`value-${index}`}>Value</Label>
                <Input
                  id={`value-${index}`}
                  type={currentFieldType === "number" ? "number" : "text"}
                  value={rule.value}
                  onChange={(e) => updateRule(index, { value: e.target.value })}
                  placeholder="Enter value"
                  disabled={disabled}
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeRule(index)} aria-label="Remove rule" className="sm:ml-2 mt-2 sm:mt-0" disabled={disabled}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        })}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2">
          <Button variant="outline" onClick={addRule} className="w-full sm:w-auto" disabled={disabled}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Rule
          </Button>
          {rules.length > 1 && (
            <div className="flex items-center gap-2">
              <Label>Logic between rules:</Label>
              <Select value={logic} onValueChange={(value: 'AND' | 'OR') => onLogicChange(value)} disabled={disabled}>
                <SelectTrigger className="w-[100px]" disabled={disabled}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND</SelectItem>
                  <SelectItem value="OR">OR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
