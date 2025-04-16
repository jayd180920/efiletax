"use client";

import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface FormSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function FormSection({
  id,
  title,
  subtitle,
  icon,
  defaultOpen = false,
  children,
}: FormSectionProps) {
  return (
    <Accordion
      type="single"
      defaultValue={defaultOpen ? id : undefined}
      className="mb-4"
    >
      <AccordionItem value={id}>
        <AccordionTrigger className="bg-gray-50">
          <div className="flex items-center">
            {icon && <div className="mr-3">{icon}</div>}
            <div>
              <h3 className="text-lg font-medium">{title}</h3>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
