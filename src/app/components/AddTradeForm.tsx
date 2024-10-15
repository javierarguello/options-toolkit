'use client';

import { useEffect, useState } from 'react';
import { IStockOption, ISymbolFinanceData, ITrade, TradeType } from '../models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { ControllerRenderProps } from 'react-hook-form';
import { financeValidateSymbol } from '@/app/services/finance.service';
import DatePicker from 'react-datepicker';
import '../styles/datepicker.css';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from 'next-themes';

const getNextFriday = (): Date => {
  const today = new Date();
  const nextFriday = new Date(today);
  nextFriday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7));
  return nextFriday;
};

const DefaultNewTrade = {
  id: Date.now(),
  expirationDate: getNextFriday(),
  symbol: '',
  contracts: 1,
  strike: 0,
  price: 0,
  type: 'short-put', // Set a default value
} as ITrade;

const tradeSchema = z.object({
  id: z.number().optional(),
  symbol: z.string().min(1, 'Symbol is required'),
  strike: z.number().positive('Strike must be greater than 0'),
  exitPrice: z
    .number()
    .min(0, 'Exit Price must be 0 or greater')
    .optional()
    .transform((val) => (val === 0 ? undefined : val)),
  expirationDate: z.date(),
  stockPrice: z.number().positive('Stock Price must be greater than 0'),
  contracts: z
    .number()
    .int()
    .positive('Number of contracts must be greater than 0'),
  price: z.number().positive('Price must be greater than 0'),
  type: z.nativeEnum(TradeType),
});

type TradeFormValues = z.infer<typeof tradeSchema>;

const findNearestStrike = (
  strikes: { strike: number; delta: number }[],
  symbolPrice: number,
) => {
  if (!strikes || strikes.length === 0) return null;
  const nearestStrike = strikes.reduce((prev, curr) =>
    Math.abs(curr.strike - symbolPrice) < Math.abs(prev.strike - symbolPrice)
      ? curr
      : prev,
  );
  return nearestStrike.strike > 0 ? nearestStrike : null;
};

export default function AddTradeForm({
  onAddTrade,
  existingTrade,
}: {
  onAddTrade: (trade: ITrade) => void;
  existingTrade?: ITrade;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [symbolError, setSymbolError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [expirationDates, setExpirationDates] = useState<Date[]>([]);
  const [isSymbolLoaded, setIsSymbolLoaded] = useState(false);
  const [strikes, setStrikes] = useState<{ strike: number; delta: number }[]>(
    [],
  );
  const [symbolFinanceData, setSymbolFinanceData] =
    useState<ISymbolFinanceData | null>(null);
  const [selectedOption, setSelectedOption] = useState<IStockOption | null>(
    null,
  );
  const [showStrikeSelect, setShowStrikeSelect] = useState(false);
  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues: existingTrade || DefaultNewTrade,
    mode: 'onBlur',
  });

  const selectedExpirationDate = form.watch('expirationDate');
  const selectedType = form.watch('type');
  const selectedStrike = form.watch('strike');
  const numberOfContracts = form.watch('contracts');
  const price = form.watch('price');

  const isShort = selectedType.toLowerCase().includes('short');

  const probability =
    selectedOption != null
      ? (isShort
          ? 1 - Math.abs(Number(selectedOption.delta.toFixed(4)))
          : Math.abs(Number(selectedOption.delta.toFixed(4)))) * 100
      : 0;

  const optionMark =
    ((selectedOption?.ask ?? 0) + (selectedOption?.bid ?? 0)) / 2;
  const premium = price * numberOfContracts * 100;

  const getSymbolFinanceData = async (symbol: string) => {
    setIsValidating(true);
    setIsSymbolLoaded(false);
    try {
      const result = await financeValidateSymbol(symbol.trim());
      if (!result.valid) {
        setSymbolError(`Invalid symbol: ${symbol}`);
        return false;
      }
      setSymbolFinanceData(result);

      form.setValue('symbol', result.name?.toUpperCase() as string);
      form.setValue('stockPrice', result.price as number);

      const currentDate = new Date(new Date().setHours(0, 0, 0, 0));
      const expirationDates =
        result.optionChain?.data
          .map((option) => new Date(option.expirationDate))
          .filter((date) => date >= currentDate)
          .sort((a, b) => a.getTime() - b.getTime()) ?? [];

      setExpirationDates(expirationDates);

      if (expirationDates.length > 0) {
        form.setValue('expirationDate', expirationDates[0]);
      }

      setSymbolError(null);
      setIsSymbolLoaded(true);
      return true;
    } catch (error) {
      console.error('Error validating symbol:', error);
      setSymbolError('Error validating symbol');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const onSubmit = async (data: ITrade) => {
    setIsSubmitting(true);

    const updatedTrade = {
      ...data,
      id: existingTrade ? existingTrade.id : Date.now(),
      exitPrice: data.exitPrice === 0 ? undefined : data.exitPrice,
    };
    onAddTrade(updatedTrade);
    if (!existingTrade) {
      form.reset(DefaultNewTrade);
    }
    setIsSubmitting(false);
  };

  const isDateDisabled = (date: Date) => {
    return expirationDates.some(
      (expDate) => expDate.toDateString() === date.toDateString(),
    );
  };

  const updateSelectedOption = () => {
    const expirationDate = form.getValues('expirationDate');
    const strike = form.getValues('strike');
    const type = form.getValues('type');

    if (!symbolFinanceData || !expirationDate || !strike || !type) return;

    const optionType = type.toLowerCase().includes('call') ? 'CALL' : 'PUT';

    const selectedOption = symbolFinanceData.optionChain?.data
      .find(
        (opt) =>
          new Date(opt.expirationDate).setHours(0, 0, 0, 0) ===
          expirationDate.setHours(0, 0, 0, 0),
      )
      ?.options[optionType].find((o) => o.strike === strike);

    setSelectedOption(selectedOption || null);

    form.setValue('price', Number(optionMark.toFixed(4)) || 0);
  };

  const updateStrikes = async () => {
    if (!symbolFinanceData) return;

    const optionType = selectedType.toLowerCase().includes('call')
      ? 'CALL'
      : 'PUT';
    const strikes = symbolFinanceData.optionChain?.data.flatMap((option) =>
      option.options[optionType]
        .filter(
          (o) =>
            new Date(o.expirationDate).setHours(0, 0, 0, 0) ===
            selectedExpirationDate.setHours(0, 0, 0, 0),
        )
        .map((o) => ({ strike: o.strike, delta: o.delta })),
    );

    setStrikes(strikes || []);
  };

  const updateDefaultStrike = () => {
    if (!symbolFinanceData || !strikes || strikes.length === 0) return;
    const nearestStrike = findNearestStrike(strikes, symbolFinanceData.price!);
    if (nearestStrike) {
      form.setValue('strike', nearestStrike.strike);
    }
  };

  useEffect(() => {
    updateStrikes();
    updateSelectedOption();
  }, [selectedExpirationDate, selectedType, symbolFinanceData]);

  useEffect(() => {
    updateSelectedOption();
  }, [selectedStrike]);

  useEffect(() => {
    updateDefaultStrike();
  }, [strikes, symbolFinanceData]);

  useEffect(() => {
    if (existingTrade) {
      form.reset(existingTrade);
      getSymbolFinanceData(existingTrade.symbol);
    }
  }, [existingTrade]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="symbol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Symbol</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Symbol"
                      {...field}
                      onBlur={async (e) => {
                        field.onBlur();
                        await getSymbolFinanceData(e.target.value);
                      }}
                      disabled={isValidating}
                    />
                    {isValidating && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        {/* Add your loader component or icon here */}
                        <span className="animate-spin">⌛</span>
                      </div>
                    )}
                  </div>
                </FormControl>
                {symbolError && (
                  <p className="text-sm text-red-500 mt-1">{symbolError}</p>
                )}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stockPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="StockPrice"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    disabled={!isSymbolLoaded}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expirationDate"
            render={({
              field,
            }: {
              field: ControllerRenderProps<ITrade, 'expirationDate'>;
            }) => (
              <FormItem>
                <FormLabel>Expiration Date</FormLabel>
                <FormControl>
                  <DatePicker
                    disabled={!isSymbolLoaded}
                    selected={field.value}
                    onChange={async (date: Date | null) => {
                      field.onChange(date);
                    }}
                    filterDate={isDateDisabled}
                    dateFormat="MM/dd/yyyy"
                    placeholderText="Select expiration date"
                    className={`w-full bg-background rounded-md border border-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                    wrapperClassName="w-full"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue('type', value as TradeType);
                  }}
                  defaultValue={form.getValues('type')}
                  disabled={!isSymbolLoaded}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trade type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="put">Put</SelectItem>
                    <SelectItem value="short-call">Short Call</SelectItem>
                    <SelectItem value="short-put">Short Put</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="strike"
            render={({
              field,
            }: {
              field: ControllerRenderProps<ITrade, 'strike'>;
            }) => (
              <FormItem>
                <FormLabel>Strike</FormLabel>
                <FormControl>
                  <Select
                    open={showStrikeSelect}
                    onOpenChange={setShowStrikeSelect}
                    onValueChange={(value) => {
                      const strike = parseFloat(value);
                      field.onChange(strike);
                      form.setValue('strike', strike);
                      setShowStrikeSelect(false);
                    }}
                    value={field.value?.toString()}
                  >
                    <SelectTrigger
                      className="w-full"
                      onClick={() => setShowStrikeSelect(true)}
                    >
                      <SelectValue>
                        {field.value
                          ? `Strike: ${field.value} Delta: ${strikes
                              .find((strike) => strike.strike === field.value)
                              ?.delta.toFixed(4)}`
                          : 'Select Strike'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800">
                      {strikes.map((strike) => (
                        <SelectItem
                          key={strike.strike}
                          value={strike.strike.toString()}
                        >
                          <span>
                            Strike: {strike.strike} - Delta:{' '}
                            {strike.delta.toFixed(4)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                {form.formState.errors.strike && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.strike.message}
                  </p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contracts"
            render={({
              field,
            }: {
              field: ControllerRenderProps<ITrade, 'contracts'>;
            }) => (
              <FormItem>
                <FormLabel>Number of Contracts</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Number of Contracts"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    disabled={!isSymbolLoaded}
                  />
                </FormControl>
                {form.formState.errors.contracts && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.contracts.message}
                  </p>
                )}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({
              field,
            }: {
              field: ControllerRenderProps<ITrade, 'price'>;
            }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Price"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    disabled={!isSymbolLoaded}
                  />
                </FormControl>
                {form.formState.errors.price && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.price.message}
                  </p>
                )}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="exitPrice"
            render={({
              field,
            }: {
              field: ControllerRenderProps<ITrade, 'exitPrice'>;
            }) => (
              <FormItem>
                <FormLabel>Exit Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Exit Price"
                    {...field}
                    onChange={(e) => {
                      const value =
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value);
                      field.onChange(value);
                    }}
                    disabled={!isSymbolLoaded}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <Button
          type="submit"
          disabled={
            isSubmitting || !!symbolError || isValidating || !isSymbolLoaded
          }
        >
          {isSubmitting
            ? existingTrade
              ? 'Updating Trade...'
              : 'Adding Trade...'
            : existingTrade
            ? 'Update Trade'
            : 'Add Trade'}
        </Button>

        {/* Updated footer section */}
        {selectedOption && (
          <div className="mt-4 p-4 border border-border rounded-md">
            <p className="text-sm font-medium mb-2">Option Details:</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm">Delta: {probability.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm">
                  {isShort ? 'Net Credit' : 'Net Debit'}: ${premium.toFixed(2)}
                </p>
              </div>
            </div>
            {/* New row for trade summary */}
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-sm font-medium">Trade Summary:</p>
              <p className="text-sm">
                {isShort ? 'Selling' : 'Buying'} {numberOfContracts}{' '}
                {selectedType.toUpperCase()} {form.getValues('symbol')} $
                {selectedStrike} {selectedExpirationDate.toLocaleDateString()} @
                ${price.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
