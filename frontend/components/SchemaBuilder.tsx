/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useForm, useFieldArray, Controller, UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import React, { useEffect, useState } from "react"

type FieldType = "string" | "number" | "nested"

export type Field = {
  name: string
  type: FieldType
  children?: Field[]
}

export type FormData = {
  fields: Field[]
}

const defaultField: Field = { name: "", type: "string", children: [] }

type RenderFieldsProps = {
  nestPath: `fields${string}`
  control: UseFormReturn<FormData>["control"]
  register: UseFormReturn<FormData>["register"]
  getValues: UseFormReturn<FormData>["getValues"]
  setValue: UseFormReturn<FormData>["setValue"]
}

function RenderFields({
  nestPath,
  control,
  register,
  getValues,
  setValue,
}: RenderFieldsProps) {
  const { fields, append, remove } = useFieldArray<FormData>({
    control,
    name: nestPath as any, 
  })

  return (
    <div className="ml-4 space-y-4 border-l border-muted pl-4">
      {fields.map((field, index) => {
        const base = `${nestPath}[${index}]`
        const typeValue = getValues(`${base}.type` as any) as FieldType

        return (
          <Card key={field.id} className="p-4 space-y-2">
            <div className="flex gap-2 items-center">
              <Input {...register(`${base}.name` as any)} placeholder="Key" />
              <Controller
                name={`${base}.type` as `fields.${number}.type`}
                control={control}
                render={({ field: controllerField }) => (
                  <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}>
                    <SelectTrigger className="w-[110px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="nested">Nested</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <Button
                variant="destructive"
                size="sm"
                type="button"
                onClick={() => remove(index)}
              >
                Delete
              </Button>
            </div>

            {typeValue === "nested" && (
              <RenderFields
                nestPath={`${base}.children` as `fields${string}`}
                control={control}
                register={register}
                getValues={getValues}
                setValue={setValue}
              />
            )}
          </Card>
        )
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append(defaultField)}
      >
        ➕ Add Field
      </Button>
    </div>
  )
}

export default function SchemaBuilder() {
  const [jsonPreview, setJsonPreview] = useState<Record<string, any>>({})
  const { control, register, getValues, setValue, watch } = useForm<FormData>({
    defaultValues: {
      fields: [],
    },
  })

  useEffect(() => {
    const subscription = watch((value) => {
      const buildSchema = (fields: Field[]): any => {
        const obj: Record<string, any> = {}
        fields?.forEach((field) => {
          if (!field.name) return
          if (field.type === "nested") {
            obj[field.name] = buildSchema(field.children || [])
          } else {
            obj[field.name] = field.type === "string" ? "string" : 0
          }
        })
        return obj  
      }

      setJsonPreview(buildSchema((value.fields || []).filter((f): f is Field => !!f)))
    })
    return () => subscription.unsubscribe()
  }, [watch])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <div>
        <h2 className="text-xl font-bold mb-4">🛠 JSON Schema Builder</h2>
        <RenderFields
          nestPath="fields"
          control={control}
          register={register}
          getValues={getValues}
          setValue={setValue}
        />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">📦 Live JSON Preview</h2>
        <pre className="bg-black text-white p-4 rounded-md text-sm overflow-auto max-h-[80vh]">
          {JSON.stringify(jsonPreview, null, 2)}
        </pre>
      </div>
    </div>
  )
}
