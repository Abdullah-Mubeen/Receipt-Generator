"use client";

import React, { useRef } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Share2, Download, Eye, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const formSchema = z.object({
  date: z.date({
    required_error: "Please select a date.",
  }),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  flatNo: z.string().min(1, { message: "Flat number is required." }),
  month: z.string().min(1, { message: "Month is required." }),
  balance: z.string().min(1, { message: "Balance is required." }),
  amount: z.string().min(1, { message: "Amount is required." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ReceiptGenerator() {
  const [activeTab, setActiveTab] = useState("form");
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      name: "",
      flatNo: "",
      month: "",
      balance: "",
      amount: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log(data);
    setActiveTab("preview");
  };

  const generatePDF = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, width, height, 'F');
      
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const x = (width - imgWidth) / 2;
      const y = 10;
      
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      
      const fileName = `receipt_${form.getValues("flatNo")}_${form.getValues("month")}.pdf`.replace(/\s+/g, '_').toLowerCase();
      pdf.save(fileName);
      
      toast({
        title: "Success",
        description: "Receipt downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };


  const shareViaWhatsApp = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const text = `Maintenance Receipt for Flat ${form.watch("flatNo")} - ${form.watch("month")}`;
      
      // Create a blob from the data URL
      const blob = await fetch(imgData).then(res => res.blob());
      const file = new File([blob], 'receipt.png', { type: 'image/png' });
      
      // Create a share object
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Maintenance Receipt',
          text: text
        });
        
        toast({
          title: "Share Initiated",
          description: "Choose WhatsApp from the share menu to send the receipt.",
        });
      } else {
        // Fallback for browsers that don't support native sharing
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
        
        toast({
          title: "WhatsApp Opened",
          description: "Please paste the receipt image manually.",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Error",
        description: "Failed to share receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatPKR = (value: string): string => {
    const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''));
    if (isNaN(numericValue)) return "Rs. 0";
    return `Rs. ${numericValue.toLocaleString('en-PK')}`;
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="form">Form</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      
      <TabsContent value="form">
        <Card>
          <CardHeader>
            <CardTitle>Receipt Information</CardTitle>
            <CardDescription>
              Enter the details for the maintenance receipt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="flatNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flat No.</FormLabel>
                        <FormControl>
                          <Input placeholder="A-101" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Month</FormLabel>
                        <FormControl>
                          <Input placeholder="January 2025" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previous Balance</FormLabel>
                        <FormControl>
                          <Input placeholder="Rs. 5000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount Paid</FormLabel>
                        <FormControl>
                          <Input placeholder="Rs. 2500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  <Eye className="mr-2 h-4 w-4" /> Preview Receipt
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="preview">
        <Card>
          <CardHeader>
            <CardTitle>Receipt Preview</CardTitle>
            <CardDescription>
              Review your maintenance receipt before generating or sharing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={receiptRef} className="bg-white p-10 max-w-2xl mx-auto">
              {/* Header */}
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h3 className="text-2xl font-light tracking-tight">RAHIM ARCADE</h3>
                  <div className="mt-4 text-sm text-gray-600 space-y-1">
                    <p>SC-24, Block-H, North Nazimabad</p>
                    <p>Karachi, Pakistan</p>
                    <p>0333-2232354</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Receipt No.</p>
                  <p className="text-lg font-medium">{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {form.watch("date") ? format(form.watch("date"), "d MMMM yyyy") : "N/A"}
                  </p>
                </div>
              </div>
              
              {/* Divider */}
              <div className="h-px bg-gray-200 my-8"></div>
              
              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <p className="text-sm text-gray-500">Resident</p>
                  <p className="text-base mt-1">{form.watch("name") || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Flat Number</p>
                  <p className="text-base mt-1">{form.watch("flatNo") || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Month</p>
                  <p className="text-base mt-1">{form.watch("month") || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Previous Balance</p>
                  <p className="text-base mt-1">{form.watch("balance") ? formatPKR(form.watch("balance")) : "N/A"}</p>
                </div>
              </div>
              
              {/* Amount */}
              <div className="mt-12 pt-8 border-t border-gray-100">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-500">Amount Paid</span>
                  <span className="text-2xl font-light">{form.watch("amount") ? formatPKR(form.watch("amount")) : "N/A"}</span>
                </div>
              </div>
              
              {/* Footer */}
              <div className="mt-16 pt-8 border-t border-gray-100">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Paid
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mb-2">
                      <svg width="120" height="40" viewBox="0 0 120 40">
                        <text x="10" y="25" fontFamily="system-ui" fontSize="16" fill="currentColor">Usman</text>
                        <line x1="10" y1="30" x2="110" y2="30" stroke="currentColor" strokeWidth="0.5" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">Authorised</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button onClick={generatePDF} className="w-full sm:w-auto bg-black hover:bg-gray-900">
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Share2 className="mr-2 h-4 w-4" /> Share Receipt
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={shareViaWhatsApp} className="cursor-pointer">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="mr-2"
                  >
                    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                    <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                    <path d="M9.5 13.5c.5 1 1.5 1 2.5 1s2-.5 2.5-1" />
                  </svg>
                  WhatsApp
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="secondary" 
              onClick={() => setActiveTab("form")} 
              className="w-full sm:w-auto"
            >
              Edit Details
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}